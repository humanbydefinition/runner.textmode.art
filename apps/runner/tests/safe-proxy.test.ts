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
});
