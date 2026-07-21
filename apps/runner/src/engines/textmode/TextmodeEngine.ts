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
	private readonly handleUserInteraction = (): void => {
		this.transport.send({ type: 'USER_INTERACTION' });
	};
	private readonly handleKeyDown = (event: KeyboardEvent): void => {
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
			onExecute: (code, requestId) => this.executeInternal(code, requestId),
		});

		this.textmode = new TextmodeManager();
		this.audioReceiver = new AudioReceiver();
		this.context = new ExecutionContext({
			getTextmode: () => this.textmode.getInstance(),
			runTextmodeSetup: (callback) => this.textmode.runUserSetup(callback),
			errorReporter: this.errorReporter,
			audioReceiver: this.audioReceiver,
		});

		this.handshakeHandler = new HandshakeHandler({
			isAllowedOrigin: (origin) => this.isAllowedOrigin(origin),
			isInitMessage: (data) => isInitMessage(data),
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
			},
		});
	}

	start(): void {
		if (this.hasStarted) return;
		this.hasStarted = true;
		this.setupGlobalErrorHandlers((error) => this.errorReporter.report(error as Error | string | Event));
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
				this.scheduleCode(msg.code, msg.requestId);
				break;
			case 'PING':
				this.transport.send({ type: 'PONG', nonce: msg.nonce, timestamp: Date.now() });
				break;
			case 'AUDIO_DATA':
				this.audioReceiver.update(msg);
				break;
			case 'DISPOSE':
				this.dispose();
				break;
		}
	};

	private scheduleCode(code: string, requestId?: string): void {
		this.scheduler.schedule({ code, requestId });
	}

	private executeInternal(code: string, requestId?: string): void {
		void this.execute(code, requestId);
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
	}

	private attachRuntimeEventHandlers(): void {
		if (this.runtimeEventHandlersAttached) return;

		this.runtimeEventHandlersAttached = true;
		window.addEventListener('pointerdown', this.handleUserInteraction, { passive: true });
		window.addEventListener('keydown', this.handleKeyDown);

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

	dispose(): void {
		if (!this.hasStarted) return;
		this.hasStarted = false;

		this.scheduler.cancel();
		this.context.dispose();
		this.textmode.dispose();
		this.runtimeInitialized = false;
		this.runtimeEventHandlersAttached = false;
		this.synthErrorReported = false;

		window.removeEventListener('message', this.handleInitMessage);
		window.removeEventListener('pointerdown', this.handleUserInteraction);
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
