import { afterEach, describe, expect, it, vi } from 'vitest';
import { TextmodeEngine } from '../src/engines/textmode/TextmodeEngine';

describe('TextmodeEngine execution recovery', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('restores the last working code when an execution-scoped setup fails', async () => {
		vi.stubGlobal('window', {
			innerWidth: 800,
			innerHeight: 600,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		});
		const engine = new TextmodeEngine(new Set(['*']));
		const execute = vi
			.fn()
			.mockResolvedValueOnce({ success: true })
			.mockResolvedValueOnce({ success: false, error: { message: 'setup exploded' } })
			.mockResolvedValueOnce({ success: true });
		const cleanupLayers = vi.fn();
		const pause = vi.fn();
		const resume = vi.fn();
		const send = vi.fn();
		const internals = engine as unknown as {
			context: {
				validateSyntax: (code: string) => { valid: boolean };
				execute: typeof execute;
			};
			textmode: {
				cleanupLayers: typeof cleanupLayers;
				pause: typeof pause;
				resume: typeof resume;
			};
			transport: { send: typeof send };
			runtimeInitialized: boolean;
		};
		internals.context = {
			validateSyntax: () => ({ valid: true }),
			execute,
		};
		internals.textmode = { cleanupLayers, pause, resume };
		internals.transport = { send };
		internals.runtimeInitialized = true;

		await engine.execute('working code', 'working');
		await engine.execute('broken setup', 'broken');

		expect(execute).toHaveBeenNthCalledWith(1, 'working code');
		expect(execute).toHaveBeenNthCalledWith(2, 'broken setup');
		expect(execute).toHaveBeenNthCalledWith(3, 'working code');
		expect(cleanupLayers).toHaveBeenCalledTimes(3);
		expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'RUN_OK', requestId: 'working' }));
		expect(pause).toHaveBeenCalledTimes(2);
		expect(resume).toHaveBeenCalledTimes(2);
	});

	it('leaves the working execution untouched when new code has a syntax error', async () => {
		vi.stubGlobal('window', {
			innerWidth: 800,
			innerHeight: 600,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		});
		const engine = new TextmodeEngine(new Set(['*']));
		const execute = vi.fn().mockResolvedValue({ success: true });
		const cleanupLayers = vi.fn();
		const report = vi.fn();
		const internals = engine as unknown as {
			context: {
				validateSyntax: (code: string) => { valid: boolean; error?: Error };
				execute: typeof execute;
			};
			errorReporter: { report: typeof report };
			textmode: {
				cleanupLayers: typeof cleanupLayers;
				pause: () => void;
				resume: () => void;
			};
			transport: { send: () => void };
			runtimeInitialized: boolean;
		};
		internals.context = {
			validateSyntax: (code) =>
				code === 'broken syntax' ? { valid: false, error: new SyntaxError('Unexpected token') } : { valid: true },
			execute,
		};
		internals.errorReporter = { report };
		internals.textmode = { cleanupLayers, pause: vi.fn(), resume: vi.fn() };
		internals.transport = { send: vi.fn() };
		internals.runtimeInitialized = true;

		await engine.execute('working code');
		await engine.execute('broken syntax');

		expect(execute).toHaveBeenCalledOnce();
		expect(execute).toHaveBeenCalledWith('working code');
		expect(cleanupLayers).toHaveBeenCalledOnce();
		expect(report).toHaveBeenCalledWith(expect.any(SyntaxError), undefined);
	});
});
