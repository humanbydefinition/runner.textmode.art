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
				code === 'broken syntax'
					? { valid: false, error: new SyntaxError('Unexpected token') }
					: { valid: true },
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

	it('rebuilds managed runtime resources without disposing the iframe engine', async () => {
		vi.stubGlobal('window', {
			innerWidth: 800,
			innerHeight: 600,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		});
		const engine = new TextmodeEngine(new Set(['*']));
		const oldContext = { dispose: vi.fn() };
		const oldTextmode = { dispose: vi.fn() };
		const execute = vi.fn().mockResolvedValue(undefined);
		const internals = engine as unknown as {
			audioReceiver: object;
			context: typeof oldContext;
			execute: typeof execute;
			lastWorkingCode: string | null;
			runtimeEventHandlersAttached: boolean;
			textmode: typeof oldTextmode;
		};
		const oldAudioReceiver = internals.audioReceiver;
		internals.context = oldContext;
		internals.textmode = oldTextmode;
		internals.execute = execute;
		internals.lastWorkingCode = 'previous sketch';
		internals.runtimeEventHandlersAttached = true;

		await engine.resetRuntime('fresh sketch', 'reset_1');

		expect(oldContext.dispose).toHaveBeenCalledOnce();
		expect(oldTextmode.dispose).toHaveBeenCalledOnce();
		expect(internals.context).not.toBe(oldContext);
		expect(internals.textmode).not.toBe(oldTextmode);
		expect(internals.audioReceiver).not.toBe(oldAudioReceiver);
		expect(internals.lastWorkingCode).toBeNull();
		expect(internals.runtimeEventHandlersAttached).toBe(true);
		expect(execute).toHaveBeenCalledWith('fresh sketch', 'reset_1');
		expect(window.addEventListener).not.toHaveBeenCalled();
	});

	it('routes reset protocol messages through the safe-frame scheduler', () => {
		vi.stubGlobal('window', {
			innerWidth: 800,
			innerHeight: 600,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		});
		const engine = new TextmodeEngine(new Set(['*']));
		const schedule = vi.fn();
		const internals = engine as unknown as {
			handlePortMessage: (event: MessageEvent) => void;
			scheduler: { schedule: typeof schedule };
		};
		internals.scheduler = { schedule };

		internals.handlePortMessage({
			data: { type: 'RESET_RUNTIME', requestId: 'reset_1', code: 'fresh sketch' },
		} as MessageEvent);

		expect(schedule).toHaveBeenCalledWith({
			code: 'fresh sketch',
			mode: 'reset-runtime',
			requestId: 'reset_1',
		});
	});

	it('reports only the first trusted interaction and ignores synthetic events', () => {
		vi.stubGlobal('window', {
			innerWidth: 800,
			innerHeight: 600,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		});
		const engine = new TextmodeEngine(new Set(['*']));
		const send = vi.fn();
		const dismiss = vi.fn();
		const internals = engine as unknown as {
			handleUserInteraction: (event: Event) => void;
			transport: { send: typeof send };
			userActivationPrompt: { dismiss: typeof dismiss };
		};
		internals.transport = { send };
		internals.userActivationPrompt = { dismiss };

		internals.handleUserInteraction({ isTrusted: false } as Event);
		internals.handleUserInteraction({ isTrusted: true } as Event);
		internals.handleUserInteraction({ isTrusted: true } as Event);

		expect(dismiss).toHaveBeenCalledOnce();
		expect(send).toHaveBeenCalledOnce();
		expect(send).toHaveBeenCalledWith({ type: 'USER_INTERACTION' });
	});
});
