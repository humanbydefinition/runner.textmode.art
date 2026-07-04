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

	it('preserves frame time during normal cleanup and resets it during soft reset', async () => {
		const { TextmodeManager } = await import('../src/engines/textmode/TextmodeManager');
		const manager = new TextmodeManager();

		manager.init();
		manager.cleanupLayers(false);

		expect(mocks.instance.frameCount).toBe(123);
		expect(mocks.instance.secs).toBe(4);

		manager.cleanupLayers(true);

		expect(mocks.instance.frameCount).toBe(0);
		expect(mocks.instance.secs).toBe(0);
	});
});
