import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExecutionResourceStack } from '../src/engines/textmode/ExecutionResourceStack';

describe('ExecutionResourceStack', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('disposes callbacks and unique resources once in LIFO order', () => {
		const trace: string[] = [];
		const first = { dispose: () => trace.push('first') };
		const second = { dispose: () => trace.push('second') };
		const stack = new ExecutionResourceStack();

		stack.use(first);
		stack.use(first);
		stack.defer(() => trace.push('callback'));
		stack.use(second);
		stack.dispose();
		stack.dispose();

		expect(trace).toEqual(['second', 'callback', 'first']);
	});

	it('immediately disposes resources and callbacks registered after disposal', () => {
		const trace: string[] = [];
		const stack = new ExecutionResourceStack();
		stack.dispose();

		stack.use({ dispose: () => trace.push('resource') });
		stack.defer(() => trace.push('callback'));

		expect(trace).toEqual(['resource', 'callback']);
	});

	it('continues cleanup when one disposer throws', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const cleanup = vi.fn();
		const stack = new ExecutionResourceStack();
		stack.defer(cleanup);
		stack.defer(() => {
			throw new Error('dispose failed');
		});

		stack.dispose();

		expect(cleanup).toHaveBeenCalledOnce();
		expect(warn).toHaveBeenCalledOnce();
	});
});
