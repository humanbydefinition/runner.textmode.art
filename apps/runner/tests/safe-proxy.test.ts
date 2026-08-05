import { describe, expect, it, vi } from 'vitest';
import { SafeProxyFactory } from '../src/engines/textmode/SafeProxyFactory';

describe('SafeProxyFactory', () => {
	it('binds non-special textmode methods to the real instance', () => {
		let calledWithOriginal = false;
		const target = {
			draw: vi.fn(),
			loadImage: vi.fn(),
			loadVideo: vi.fn(),
			loadFont: vi.fn(),
			layers: { base: {}, add: vi.fn(), all: [] },
			checkThis() {
				calledWithOriginal = this === target;
				return 'ok';
			},
		};
		const factory = new SafeProxyFactory({
			onDrawError: vi.fn(),
			hasDrawError: () => false,
		});

		const proxy = factory.createTextmodeProxy(target as never) as unknown as {
			checkThis: () => string;
		};

		expect(proxy.checkThis()).toBe('ok');
		expect(calledWithOriginal).toBe(true);
	});

	it('keeps draw callbacks wrapped for draw-loop error reporting', () => {
		const onDrawError = vi.fn();
		const draw = vi.fn();
		const target = {
			draw,
			loadImage: vi.fn(),
			loadVideo: vi.fn(),
			loadFont: vi.fn(),
			layers: { base: {}, add: vi.fn(), all: [] },
		};
		const factory = new SafeProxyFactory({
			onDrawError,
			hasDrawError: () => false,
		});

		const proxy = factory.createTextmodeProxy(target as never);
		const error = new Error('draw exploded');
		proxy.draw(() => {
			throw error;
		});

		const wrappedCallback = draw.mock.calls[0]?.[0] as (() => void) | undefined;
		expect(wrappedCallback).toBeTypeOf('function');

		wrappedCallback?.();
		expect(onDrawError).toHaveBeenCalledWith(error);
	});

	it('captures setup callbacks without forwarding them to the one-shot textmode lifecycle', async () => {
		const setup = vi.fn();
		const onSetup = vi.fn();
		const target = {
			draw: vi.fn(),
			loadImage: vi.fn(),
			loadVideo: vi.fn(),
			loadFont: vi.fn(),
			setup,
			layers: { base: {}, add: vi.fn(), all: [] },
		};
		const factory = new SafeProxyFactory({
			onDrawError: vi.fn(),
			hasDrawError: () => false,
		});
		const callback = vi.fn();

		const proxy = factory.createTextmodeProxy(target as never, { onSetup });
		await proxy.setup(callback);

		expect(onSetup).toHaveBeenCalledWith(callback);
		expect(setup).not.toHaveBeenCalled();
	});

	it('registers synchronous and asynchronous resources created through textmode factories', async () => {
		const framebuffer = { dispose: vi.fn() };
		const texture = { dispose: vi.fn() };
		const materialShader = { dispose: vi.fn() };
		const shader = { dispose: vi.fn() };
		const onResource = vi.fn();
		const target = {
			draw: vi.fn(),
			loadImage: vi.fn(),
			loadVideo: vi.fn(),
			loadFont: vi.fn(),
			createFramebuffer: vi.fn(() => framebuffer),
			createTexture: vi.fn(() => texture),
			createMaterialShader: vi.fn(async () => materialShader),
			createShader: vi.fn(async () => shader),
			layers: { base: {}, add: vi.fn(), all: [] },
		};
		const factory = new SafeProxyFactory({
			onDrawError: vi.fn(),
			hasDrawError: () => false,
		});
		const proxy = factory.createTextmodeProxy(target as never, {
			onSetup: vi.fn(),
			onResource,
		});

		expect(proxy.createFramebuffer({})).toBe(framebuffer);
		expect(proxy.createTexture({} as HTMLCanvasElement)).toBe(texture);
		await expect(proxy.createMaterialShader('material')).resolves.toBe(materialShader);
		await expect(proxy.createShader('vertex', 'fragment')).resolves.toBe(shader);

		expect(onResource.mock.calls.map(([resource]) => resource)).toEqual([
			framebuffer,
			texture,
			materialShader,
			shader,
		]);
	});
});
