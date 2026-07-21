import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
	const baseLayer = {
		blendMode: vi.fn(),
		bpm: vi.fn(),
		draw: vi.fn(),
		fontSize: vi.fn(),
		offset: vi.fn(),
		opacity: vi.fn(),
		rotateZ: vi.fn(),
		show: vi.fn(),
	};
	const instance = {
		canvas: { remove: vi.fn() },
		destroy: vi.fn(),
		frameCount: 123,
		frameRate: vi.fn(),
		grid: undefined as { cols: number; rows: number } | undefined,
		isRenderingFrame: false,
		layers: {
			base: baseLayer,
			all: [],
			clear: vi.fn(),
		},
		lineWeight: vi.fn(),
		loop: vi.fn(),
		noLoop: vi.fn(),
		resetShader: vi.fn(),
		resizeCanvas: vi.fn(),
		secs: 4,
		setup: vi.fn(),
	};

	return {
		baseLayer,
		instance,
		textmodeCreate: vi.fn(() => instance),
	};
});

vi.mock('textmode.js', () => ({
	Textmodifier: class Textmodifier {},
	textmode: {
		create: mocks.textmodeCreate,
	},
}));

vi.mock('textmode.export.js', () => ({
	createTextmodeExportPlugin: vi.fn(() => ({ name: 'export' })),
}));

vi.mock('textmode.figlet.js', () => ({
	FigletPlugin: { name: 'figlet' },
}));

vi.mock('textmode.filters.js', () => ({
	FiltersPlugin: { name: 'filters' },
}));

vi.mock('textmode.synth.js', () => ({
	SynthPlugin: { name: 'synth' },
	setGlobalErrorCallback: vi.fn(),
}));

describe('TextmodeManager', () => {
	beforeEach(() => {
		mocks.instance.frameCount = 123;
		mocks.instance.grid = undefined;
		mocks.instance.secs = 4;
		vi.stubGlobal('window', {
			innerWidth: 800,
			innerHeight: 600,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		});
		vi.stubGlobal('document', {
			body: {
				appendChild: vi.fn(),
			},
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.unstubAllGlobals();
	});

	it('preserves frame time during execution cleanup', async () => {
		const { TextmodeManager } = await import('../src/engines/textmode/TextmodeManager');
		const manager = new TextmodeManager();

		manager.init();
		manager.cleanupLayers();

		expect(mocks.instance.frameCount).toBe(123);
		expect(mocks.instance.secs).toBe(4);

		manager.cleanupLayers();

		expect(mocks.instance.frameCount).toBe(123);
		expect(mocks.instance.secs).toBe(4);
	});

	it('runs the first user setup through textmode setup after grid initialization', async () => {
		let librarySetup: (() => Promise<void>) | undefined;
		mocks.instance.setup.mockImplementation((callback: () => Promise<void>) => {
			librarySetup = callback;
		});
		const { TextmodeManager } = await import('../src/engines/textmode/TextmodeManager');
		const manager = new TextmodeManager();
		manager.init();

		const userSetup = vi.fn(() => {
			expect(mocks.instance.grid?.cols).toBe(80);
		});
		const running = manager.runUserSetup(userSetup);
		expect(mocks.instance.noLoop).not.toHaveBeenCalled();
		expect(userSetup).not.toHaveBeenCalled();

		mocks.instance.grid = { cols: 80, rows: 30 };
		await librarySetup?.();
		await running;

		expect(mocks.instance.setup).toHaveBeenCalledTimes(1);
		expect(mocks.instance.noLoop).toHaveBeenCalledTimes(1);
		expect(userSetup).toHaveBeenCalledTimes(1);
	});

	it('runs later setups once per execution and keeps setup errors out of textmode initialization', async () => {
		let librarySetup: (() => Promise<void>) | undefined;
		mocks.instance.setup.mockImplementation((callback: () => Promise<void>) => {
			librarySetup = callback;
		});
		const { TextmodeManager } = await import('../src/engines/textmode/TextmodeManager');
		const manager = new TextmodeManager();
		manager.init();

		const first = manager.runUserSetup(async () => {
			throw new Error('setup exploded');
		});
		await expect(librarySetup?.()).resolves.toBeUndefined();
		await expect(first).rejects.toThrow('setup exploded');

		const secondSetup = vi.fn();
		await expect(manager.runUserSetup(secondSetup)).resolves.toBeUndefined();

		expect(secondSetup).toHaveBeenCalledTimes(1);
		expect(mocks.instance.noLoop).toHaveBeenCalledTimes(2);
	});

	it('releases the public setup bridge when disposed before an execution arrives', async () => {
		let librarySetup: (() => Promise<void>) | undefined;
		mocks.instance.setup.mockImplementation((callback: () => Promise<void>) => {
			librarySetup = callback;
		});
		const { TextmodeManager } = await import('../src/engines/textmode/TextmodeManager');
		const manager = new TextmodeManager();
		manager.init();

		const initializing = librarySetup?.();
		manager.dispose();

		await expect(initializing).resolves.toBeUndefined();
	});
});
