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
		canvas: { remove: vi.fn(), dispatchEvent: vi.fn() },
		destroy: vi.fn(),
		exportOverlay: { hide: vi.fn() },
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
	ExportPlugin: { name: 'export' },
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

let resizeHandler: (() => void) | undefined;

describe('TextmodeManager', () => {
	beforeEach(() => {
		resizeHandler = undefined;
		mocks.instance.frameCount = 123;
		mocks.instance.grid = undefined;
		mocks.instance.secs = 4;
		vi.stubGlobal('window', {
			innerWidth: 800,
			innerHeight: 600,
			addEventListener: vi.fn((eventName: string, handler: () => void) => {
				if (eventName === 'resize') resizeHandler = handler;
			}),
			removeEventListener: vi.fn(),
		});
		vi.stubGlobal('document', {
			body: {
				appendChild: vi.fn(),
			},
		});
		vi.stubGlobal(
			'MouseEvent',
			class FakeMouseEvent {
				type: string;
				clientX: number;
				clientY: number;
				button: number;
				buttons: number;
				constructor(type: string, init?: MouseEventInit) {
					this.type = type;
					this.clientX = init?.clientX ?? 0;
					this.clientY = init?.clientY ?? 0;
					this.button = init?.button ?? 0;
					this.buttons = init?.buttons ?? 0;
				}
			}
		);
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

	it('resizes the textmode canvas to the viewport without user sketch code', async () => {
		const { TextmodeManager } = await import('../src/engines/textmode/TextmodeManager');
		const manager = new TextmodeManager();
		manager.init();

		Object.assign(window, { innerWidth: 1024, innerHeight: 768 });
		resizeHandler?.();

		expect(mocks.instance.resizeCanvas).toHaveBeenCalledOnce();
		expect(mocks.instance.resizeCanvas).toHaveBeenCalledWith(1024, 768);

		manager.dispose();
		expect(window.removeEventListener).toHaveBeenCalledWith('resize', resizeHandler);
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

	it('can create a fresh textmode instance after disposal', async () => {
		const { TextmodeManager } = await import('../src/engines/textmode/TextmodeManager');
		const manager = new TextmodeManager();

		manager.init();
		manager.dispose();
		manager.init();

		expect(mocks.textmodeCreate).toHaveBeenCalledTimes(2);
		expect(mocks.instance.destroy).toHaveBeenCalledOnce();
		expect(document.body.appendChild).toHaveBeenCalledTimes(2);
	});

	it('dispatches synthetic MouseEvents to canvas', async () => {
		const { TextmodeManager } = await import('../src/engines/textmode/TextmodeManager');
		const manager = new TextmodeManager();

		manager.init();
		manager.dispatchMouseEvent({
			eventType: 'mousemove',
			clientX: 150,
			clientY: 250,
			buttons: 1,
		});

		expect(mocks.instance.canvas.dispatchEvent).toHaveBeenCalledOnce();
		const call = mocks.instance.canvas.dispatchEvent.mock.calls[0];
		expect(call).toBeDefined();
		const dispatched = call![0] as MouseEvent;
		expect(dispatched.type).toBe('mousemove');
		expect(dispatched.clientX).toBe(150);
		expect(dispatched.clientY).toBe(250);
		expect(dispatched.buttons).toBe(1);
	});

	it('preserves coordinates for non-bubbling mouseleave events', async () => {
		const { TextmodeManager } = await import('../src/engines/textmode/TextmodeManager');
		const manager = new TextmodeManager();

		manager.init();
		manager.dispatchMouseEvent({ eventType: 'mouseleave', clientX: 75, clientY: 125 });

		const dispatched = mocks.instance.canvas.dispatchEvent.mock.calls[0]![0] as MouseEvent;
		expect(dispatched.type).toBe('mouseleave');
		expect(dispatched.clientX).toBe(75);
		expect(dispatched.clientY).toBe(125);
	});
});
