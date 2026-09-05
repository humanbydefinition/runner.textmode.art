import { MessagePortTransport } from '@/core/transport/MessagePortTransport';
import { TextmodeManager } from '@/engines/textmode/TextmodeManager';
import { ExecutionContext } from '@/engines/textmode/ExecutionContext';
import { AudioReceiver } from '@/engines/textmode/AudioReceiver';
import { ErrorReporter } from '@/engines/textmode/ErrorReporter';
import { FrameScheduler } from '@/engines/textmode/FrameScheduler';
import {
	createRunnerCapabilities,
	isInitMessage,
	isParentMessage,
	type ParentToRunnerMessage,
	type RunnerCapabilities,
	type RunnerToParentMessage,
	type WindowToRunnerMessage,
} from '@textmode/runner-protocol';

import { HandshakeHandler } from '@/core/transport/HandshakeHandler';
import { UserActivationPrompt } from '@/core/user-activation/UserActivationPrompt';
import { getRunnerShortcut } from './shortcuts';

/**
 * Concrete engine implementation for Textmode sketches.
 * Manages MessagePort communication, global error handling,
 * and the full textmode.js execution lifecycle inside the sandbox iframe.
 */
export class TextmodeEngine {
	private readonly transport = new MessagePortTransport<RunnerToParentMessage>();
	private readonly allowedParentOrigins: Set<string>;
	private readonly errorReporter: ErrorReporter;
	private readonly scheduler: FrameScheduler;
	private readonly handshakeHandler: HandshakeHandler;
	private lastWorkingCode: string | null = null;
	private hasStarted = false;
	private textmode: TextmodeManager;
	private audioReceiver: AudioReceiver;
	private context: ExecutionContext;
	private synthErrorReported = false;
	private isExecuting = false;
	private errorHandler: ((event: ErrorEvent) => void) | null = null;
	private rejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;
	private runtimeInitialized = false;
	private runtimeEventHandlersAttached = false;
	private userInteractionReported = false;
	private readonly userActivationPrompt = new UserActivationPrompt();
	private readonly handleUserInteraction = (event: Event): void => {
		if (!event.isTrusted || this.userInteractionReported) return;

		this.userInteractionReported = true;
		this.userActivationPrompt.dismiss();
		this.transport.send({ type: 'USER_INTERACTION' });
	};
	private readonly handleKeyDown = (event: KeyboardEvent): void => {
		if (event.key !== 'Escape') {
			this.handleUserInteraction(event);
		}

		const shortcut = getRunnerShortcut(event);
		if (!shortcut) return;

		event.preventDefault();
		this.transport.send({ type: shortcut === 'hard-reset' ? 'HARD_RESET' : 'TOGGLE_UI' });
	};

	constructor(allowedParentOrigins: Set<string>) {
		this.allowedParentOrigins = allowedParentOrigins;
		this.errorReporter = new ErrorReporter((msg) => this.transport.send(msg));
		this.scheduler = new FrameScheduler({
			isRendering: () => this.isRendering(),
			onExecute: (execution) => this.executeInternal(execution),
		});

		this.textmode = new TextmodeManager();
		this.audioReceiver = new AudioReceiver();
		this.context = this.createExecutionContext();

		this.handshakeHandler = new HandshakeHandler({
			isAllowedOrigin: (origin) => this.isAllowedOrigin(origin),
			isInitMessage: (data) => isInitMessage(data),
			onOriginEstablished: (origin) => {
				this.userActivationPrompt.show(origin);
			},
			onPortExtracted: (port) => {
				this.transport.attach(port, this.handlePortMessage as (event: MessageEvent) => void);
			},
			onReady: (initMessage) => {
				if (!isInitMessage(initMessage)) return;
				window.removeEventListener('message', this.handleInitMessage);
				this.transport.send({
					type: 'READY',
					capabilities: this.getCapabilities(),
				});
				if (this.userActivationPrompt.isVisible) {
					this.transport.send({ type: 'USER_ACTIVATION_REQUIRED' });
				}
			},
		});
	}

	private createExecutionContext(): ExecutionContext {
		return new ExecutionContext({
			getTextmode: () => this.textmode.getInstance(),
			runTextmodeSetup: (callback) => this.textmode.runUserSetup(callback),
			errorReporter: this.errorReporter,
			audioReceiver: this.audioReceiver,
		});
	}

	start(): void {
		if (this.hasStarted) return;
		this.hasStarted = true;
		this.setupGlobalErrorHandlers((error) => this.errorReporter.report(error as Error | string | Event));
		this.attachRuntimeEventHandlers();
		window.addEventListener('message', this.handleInitMessage);
	}

	private isAllowedOrigin(origin: string): boolean {
		if (this.allowedParentOrigins.has('*')) return true;
		return this.allowedParentOrigins.has(origin);
	}

	private setupGlobalErrorHandlers(reportError: (error: unknown) => void): void {
		this.teardownGlobalErrorHandlers();

		this.errorHandler = (event: ErrorEvent) => {
			reportError(event.error ?? event.message);
		};
		this.rejectionHandler = (event: PromiseRejectionEvent) => {
			reportError(event.reason);
		};

		window.addEventListener('error', this.errorHandler);
		window.addEventListener('unhandledrejection', this.rejectionHandler);
	}

	private teardownGlobalErrorHandlers(): void {
		if (this.errorHandler) {
			window.removeEventListener('error', this.errorHandler);
			this.errorHandler = null;
		}
		if (this.rejectionHandler) {
			window.removeEventListener('unhandledrejection', this.rejectionHandler);
			this.rejectionHandler = null;
		}
	}

	private handleInitMessage = (event: MessageEvent<WindowToRunnerMessage>): void => {
		this.handshakeHandler.createWindowMessageHandler()(event as MessageEvent);
	};

	private handlePortMessage = (event: MessageEvent<ParentToRunnerMessage>): void => {
		const msg = event.data;
		if (!isParentMessage(msg)) return;

		switch (msg.type) {
			case 'RUN_CODE':
				this.ensureRuntimeInitialized();
				this.scheduleCode(msg.code, 'run', msg.requestId);
				break;
			case 'RESET_RUNTIME':
				this.scheduleCode(msg.code, 'reset-runtime', msg.requestId);
				break;
			case 'PING':
				this.transport.send({ type: 'PONG', nonce: msg.nonce, timestamp: Date.now() });
				break;
			case 'AUDIO_DATA':
				this.audioReceiver.update(msg);
				break;
			case 'MOUSE_EVENT':
				this.ensureRuntimeInitialized();
				this.textmode.dispatchMouseEvent(msg.event);
				break;
			case 'DISPOSE':
				this.dispose();
				break;
		}
	};

	private scheduleCode(code: string, mode: 'run' | 'reset-runtime', requestId?: string): void {
		this.scheduler.schedule({ code, mode, requestId });
	}

	private executeInternal(execution: { code: string; mode: 'run' | 'reset-runtime'; requestId?: string }): void {
		const operation =
			execution.mode === 'reset-runtime'
				? this.resetRuntime(execution.code, execution.requestId)
				: this.execute(execution.code, execution.requestId);
		void operation.catch((error) => this.errorReporter.report(error as Error, execution.requestId));
	}

	/**
	 * Initialize Textmode environment lazily. The runner now owns a responsive,
	 * window-sized canvas rather than accepting fixed editor runtime settings.
	 */
	private ensureRuntimeInitialized(): void {
		if (this.runtimeInitialized) return;

		this.textmode.init();
		this.runtimeInitialized = true;
		this.attachRuntimeEventHandlers();
		this.setupSynthErrorHandler();
	}

	private attachRuntimeEventHandlers(): void {
		if (this.runtimeEventHandlersAttached) return;

		this.runtimeEventHandlersAttached = true;
		window.addEventListener('click', this.handleUserInteraction, { capture: true, passive: true });
		window.addEventListener('keydown', this.handleKeyDown);
	}

	private setupSynthErrorHandler(): void {
		this.textmode.setupSynthErrorHandler((error) => {
			if (!this.synthErrorReported) {
				this.synthErrorReported = true;
				this.transport.send({
					type: 'SYNTH_ERROR',
					message: error.message,
				});
			}
		});
	}

	/**
	 * Rebuild the complete sketch runtime while preserving this iframe document
	 * and its established MessagePort connection.
	 */
	async resetRuntime(code: string, requestId?: string): Promise<void> {
		this.context.dispose();
		this.textmode.dispose();

		this.textmode = new TextmodeManager();
		this.audioReceiver = new AudioReceiver();
		this.context = this.createExecutionContext();
		this.runtimeInitialized = false;
		this.lastWorkingCode = null;
		this.synthErrorReported = false;

		await this.execute(code, requestId);
	}

	dispose(): void {
		if (!this.hasStarted) return;
		this.hasStarted = false;

		this.scheduler.cancel();
		this.context.dispose();
		this.textmode.dispose();
		this.runtimeInitialized = false;
		this.runtimeEventHandlersAttached = false;
		this.synthErrorReported = false;
		this.userInteractionReported = false;
		this.userActivationPrompt.dispose();

		window.removeEventListener('message', this.handleInitMessage);
		window.removeEventListener('click', this.handleUserInteraction, true);
		window.removeEventListener('keydown', this.handleKeyDown);

		this.teardownGlobalErrorHandlers();
		this.transport.detach();
	}

	/**
	 * Check if Textmode is rendering to prevent frame drops during execution.
	 */
	isRendering(): boolean {
		return this.isExecuting || this.textmode.isRendering();
	}

	/**
	 * Execute code in the current sandboxed textmode runtime.
	 */
	async execute(code: string, requestId?: string): Promise<void> {
		this.ensureRuntimeInitialized();

		this.synthErrorReported = false;
		this.isExecuting = true;
		this.textmode.pause();

		try {
			const validation = this.context.validateSyntax(code);
			if (!validation.valid) {
				this.errorReporter.report(validation.error!, requestId);
				return;
			}

			this.textmode.cleanupLayers();

			const result = await this.context.execute(code);

			if (result.success) {
				this.lastWorkingCode = code;
				this.transport.send({ type: 'RUN_OK', timestamp: Date.now(), requestId });
			} else if (result.error) {
				this.errorReporter.report(result.error, requestId);

				if (this.lastWorkingCode && this.lastWorkingCode !== code) {
					await this.restoreLastWorking();
				}
			}
		} finally {
			this.isExecuting = false;
			this.textmode.resume();
		}
	}

	private async restoreLastWorking(): Promise<void> {
		if (!this.lastWorkingCode) return;

		try {
			this.textmode.cleanupLayers();
			const result = await this.context.execute(this.lastWorkingCode);
			if (!result.success) {
				console.warn('Failed to restore last working code:', result.error?.message);
			}
		} catch (e) {
			console.warn('Error during restoration:', e);
		}
	}

	private getCapabilities(): RunnerCapabilities {
		return createRunnerCapabilities();
	}
}
