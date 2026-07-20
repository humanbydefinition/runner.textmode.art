import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioReceiver } from '../src/engines/textmode/AudioReceiver';
import { ErrorReporter } from '../src/engines/textmode/ErrorReporter';
import { ExecutionContext } from '../src/engines/textmode/ExecutionContext';

const createTextmodeStub = () => ({
	draw: vi.fn(),
	loadImage: vi.fn(),
	loadVideo: vi.fn(),
	loadFont: vi.fn(),
	setup: vi.fn(),
	layers: { base: {}, add: vi.fn(), all: [] },
});

const createContext = (trace: string[]) => {
	const textmode = createTextmodeStub();
	const runTextmodeSetup = vi.fn(async (callback?: () => void | Promise<void>) => {
		trace.push('ready');
		await callback?.();
	});
	const context = new ExecutionContext({
		getTextmode: () => textmode as never,
		runTextmodeSetup,
		errorReporter: new ErrorReporter(() => {}),
		audioReceiver: new AudioReceiver(),
	});

	return { context, runTextmodeSetup, textmode };
};

describe('ExecutionContext setup lifecycle', () => {
	beforeEach(() => {
		delete (globalThis as typeof globalThis & { __setupTrace?: string[] }).__setupTrace;
	});

	it('awaits setup after the code body on every execution', async () => {
		const trace: string[] = [];
		(globalThis as typeof globalThis & { __setupTrace: string[] }).__setupTrace = trace;
		const { context, runTextmodeSetup, textmode } = createContext(trace);
		const code = `
globalThis.__setupTrace.push('body');
t.setup(async () => {
  globalThis.__setupTrace.push('setup-start');
  await Promise.resolve();
  globalThis.__setupTrace.push('setup-end');
});`;

		await expect(context.execute(code)).resolves.toMatchObject({ success: true });
		await expect(context.execute(code)).resolves.toMatchObject({ success: true });

		expect(trace).toEqual([
			'body',
			'ready',
			'setup-start',
			'setup-end',
			'body',
			'ready',
			'setup-start',
			'setup-end',
		]);
		expect(runTextmodeSetup).toHaveBeenCalledTimes(2);
		expect(textmode.setup).not.toHaveBeenCalled();
	});

	it('uses the last setup registration and leaves setup-free code unchanged', async () => {
		const trace: string[] = [];
		(globalThis as typeof globalThis & { __setupTrace: string[] }).__setupTrace = trace;
		const { context, runTextmodeSetup } = createContext(trace);

		await expect(
			context.execute(`
t.setup(() => globalThis.__setupTrace.push('first'));
t.setup(() => globalThis.__setupTrace.push('second'));
`)
		).resolves.toMatchObject({ success: true });
		await expect(context.execute(`globalThis.__setupTrace.push('plain');`)).resolves.toMatchObject({
			success: true,
		});

		expect(trace).toEqual(['ready', 'second', 'plain', 'ready']);
		expect(runTextmodeSetup).toHaveBeenCalledTimes(2);
	});

	it('disposes the previous execution before running the next setup', async () => {
		const trace: string[] = [];
		(globalThis as typeof globalThis & { __setupTrace: string[] }).__setupTrace = trace;
		const { context } = createContext(trace);

		await context.execute(`
onDispose(() => globalThis.__setupTrace.push('dispose-first'));
t.setup(() => globalThis.__setupTrace.push('setup-first'));
`);
		await context.execute(`
globalThis.__setupTrace.push('body-second');
t.setup(() => globalThis.__setupTrace.push('setup-second'));
`);

		expect(trace).toEqual([
			'ready',
			'setup-first',
			'dispose-first',
			'body-second',
			'ready',
			'setup-second',
		]);
	});

	it('reports invalid and rejected setup callbacks and disposes partial setup state', async () => {
		const trace: string[] = [];
		(globalThis as typeof globalThis & { __setupTrace: string[] }).__setupTrace = trace;
		const { context } = createContext(trace);

		const rejected = await context.execute(`
onDispose(() => globalThis.__setupTrace.push('disposed'));
t.setup(async () => {
  globalThis.__setupTrace.push('setup');
  throw new Error('setup exploded');
});
`);
		const invalid = await context.execute(`t.setup(42);`);

		expect(rejected).toMatchObject({ success: false, error: { message: 'setup exploded' } });
		expect(trace).toEqual(['ready', 'setup', 'disposed']);
		expect(invalid).toMatchObject({
			success: false,
			error: { message: 't.setup expects a function' },
		});
	});
});
