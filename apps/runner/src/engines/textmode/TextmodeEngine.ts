import { MessagePortTransport } from '@/core/transport/MessagePortTransport';
import { TextmodeManager } from '@/engines/textmode/TextmodeManager';
import { ExecutionContext } from '@/engines/textmode/ExecutionContext';
import { ErrorReporter } from '@/engines/textmode/ErrorReporter';
import { FrameScheduler } from '@/engines/textmode/FrameScheduler';
import {
	createRunnerCapabilities,
	isInitMessage,
	isParentMessage,
	type ExportMessage,
	type LoadFontMessage,
	type ParentToRunnerMessage,
	type PlaybackMessage,
	type RunnerCapabilities,
	type RunnerToParentMessage,
	type RuntimeSettings,
	type WindowToRunnerMessage,
} from '@textmode/runner-protocol';

import { HandshakeHandler } from '@/core/transport/HandshakeHandler';

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
	private context: ExecutionContext;
	private synthErrorReported = false;
	private isExecuting = false;
	private playbackMonitorId: number | null = null;
	private lastPlaybackStateSentAt = 0;
	private lastPlaybackFrameSent = -1;
	private errorHandler: ((event: ErrorEvent) => void) | null = null;
	private rejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;
	private runtimeInitialized = false;
	private runtimeEventHandlersAttached = false;
	private readonly handleUserInteraction = (): void => {
		this.transport.send({ type: 'USER_INTERACTION' });
	};
	private readonly handleKeyDown = (event: KeyboardEvent): void => {
		if (event.ctrlKey && event.shiftKey && (event.key === 'H' || event.key === 'h')) {
			event.preventDefault();
			this.transport.send({ type: 'TOGGLE_UI' });
		}
	};

	constructor(allowedParentOrigins: Set<string>) {
		this.allowedParentOrigins = allowedParentOrigins;
		this.errorReporter = new ErrorReporter((msg) => this.transport.send(msg));
		this.scheduler = new FrameScheduler({
			isRendering: () => this.isRendering(),
			onExecute: (code, isSoftReset, requestId) => this.executeInternal(code, isSoftReset, requestId),
		});

		this.textmode = new TextmodeManager();
		this.context = new ExecutionContext({
			getTextmode: () => this.textmode.getInstance(),
			errorReporter: this.errorReporter,
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
				this.scheduleCode(msg.code, false, msg.requestId);
				break;
			case 'SOFT_RESET':
				this.ensureRuntimeInitialized();
				this.scheduleCode(msg.code, true, msg.requestId);
				break;
			case 'CONFIGURE_RUNTIME':
				this.configureRuntime(msg.settings);
				this.sendPlaybackState(msg.requestId);
				break;
			case 'SET_SETTINGS':
				this.ensureRuntimeInitialized();
				this.textmode.updateSettings(msg.settings);
				this.sendPlaybackState(msg.requestId);
				break;
			case 'EXPORT':
				this.ensureRuntimeInitialized();
				void this.handleExportMessage(msg);
				break;
			case 'LOAD_FONT':
				this.ensureRuntimeInitialized();
				void this.handleLoadFontMessage(msg);
				break;
			case 'PLAYBACK':
				this.ensureRuntimeInitialized();
				this.handlePlaybackMessage(msg);
				break;
			case 'PING':
				this.transport.send({ type: 'PONG', nonce: msg.nonce, timestamp: Date.now() });
				break;
			case 'DISPOSE':
				this.dispose();
				break;
		}
	};

	private scheduleCode(code: string, isSoftReset: boolean, requestId?: string): void {
		this.scheduler.schedule({ code, isSoftReset, requestId });
	}

	private executeInternal(code: string, isSoftReset: boolean, requestId?: string): void {
		void this.execute(code, isSoftReset, requestId);
	}

	/**
	 * Initialize Textmode environment lazily. Configurable hosts send
	 * CONFIGURE_RUNTIME first so the initial canvas is created with their
	 * requested dimensions; hosts without explicit settings get the legacy
	 * default runtime on their first RUN_CODE.
	 */
	private ensureRuntimeInitialized(settings?: Partial<RuntimeSettings>): void {
		if (!this.runtimeInitialized) {
			this.textmode.init(settings);
			this.runtimeInitialized = true;
			this.attachRuntimeEventHandlers();
			return;
		}

		if (settings) {
			this.textmode.configure(settings as RuntimeSettings);
		}
	}

	private configureRuntime(settings: RuntimeSettings): void {
		if (!this.runtimeInitialized) {
			this.ensureRuntimeInitialized(settings);
			return;
		}

		this.textmode.configure(settings);
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
		this.stopPlaybackMonitor();

		window.removeEventListener('message', this.handleInitMessage);
		window.removeEventListener('pointerdown', this.handleUserInteraction);
		window.removeEventListener('keydown', this.handleKeyDown);

		this.teardownGlobalErrorHandlers();
		this.transport.detach();
	}

    /**
     * Check if Textmode is rendering (to prevent frame drops during execution)
     */
	isRendering(): boolean {
		return this.isExecuting || this.textmode.isRendering();
	}

    /**
     * Execute code
     */
	async execute(code: string, isSoftReset: boolean, requestId?: string): Promise<void> {
		this.ensureRuntimeInitialized();

		// Reset synth error flags
		this.synthErrorReported = false;
		this.isExecuting = true;

		// Pause animation
		this.textmode.pause();

		try {
			// Validate syntax
			const validation = this.context.validateSyntax(code);
			if (!validation.valid) {
				this.errorReporter.report(validation.error!, requestId);
				return;
			}

			// Cleanup layers
			this.textmode.cleanupLayers(isSoftReset);

			// Execute
			const result = await this.context.execute(code);

			if (result.success) {
				// Success!
				this.lastWorkingCode = code;
				this.transport.send({ type: 'RUN_OK', timestamp: Date.now(), requestId });
			} else if (result.error) {
				// Runtime error
				this.errorReporter.report(result.error, requestId);

				// Attempt restore
				if (this.lastWorkingCode && this.lastWorkingCode !== code) {
					await this.restoreLastWorking();
				}
			}
		} finally {
			this.isExecuting = false;
			this.textmode.resume();
			this.sendPlaybackState();
			this.startPlaybackMonitor();
		}
	}

    /**
     * Restore last working code
     */
	private async restoreLastWorking(): Promise<void> {
		if (!this.lastWorkingCode) return;

		try {
			this.textmode.cleanupLayers(false);
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

	private async handleExportMessage(message: ExportMessage): Promise<void> {
		try {
			switch (message.format) {
				case 'image': {
					const options = message.options && 'format' in message.options ? message.options : {};
					const { blob, mimeType } = await this.textmode.exportImageBlob(options);
					this.transport.send({
						type: 'EXPORT_RESULT',
						requestId: message.requestId,
						format: 'image',
						blob,
						mimeType,
					});
					break;
				}
				case 'svg': {
					const text = this.textmode.exportSvg((message.options ?? {}) as Record<string, unknown>);
					this.transport.send({
						type: 'EXPORT_RESULT',
						requestId: message.requestId,
						format: 'svg',
						text,
						mimeType: 'image/svg+xml',
					});
					break;
				}
				case 'txt': {
					const text = this.textmode.exportTxt((message.options ?? {}) as Record<string, unknown>);
					this.transport.send({
						type: 'EXPORT_RESULT',
						requestId: message.requestId,
						format: 'txt',
						text,
						mimeType: 'text/plain',
					});
					break;
				}
				case 'gif':
					await this.textmode.exportGif({
						...(message.options ?? {}),
						onProgress: (progress: unknown) => {
							this.transport.send({
								type: 'EXPORT_PROGRESS',
								requestId: message.requestId,
								format: 'gif',
								progress: this.normalizeProgress(progress),
							});
						},
					});
					this.transport.send({
						type: 'EXPORT_RESULT',
						requestId: message.requestId,
						format: 'gif',
						mimeType: 'image/gif',
					});
					break;
				case 'webm':
					await this.textmode.exportWebm({
						...(message.options ?? {}),
						onProgress: (progress: unknown) => {
							this.transport.send({
								type: 'EXPORT_PROGRESS',
								requestId: message.requestId,
								format: 'webm',
								progress: this.normalizeProgress(progress),
							});
						},
					});
					this.transport.send({
						type: 'EXPORT_RESULT',
						requestId: message.requestId,
						format: 'webm',
						mimeType: 'video/webm',
					});
					break;
			}
		} catch (error) {
			this.errorReporter.report(error as Error, message.requestId);
		}
	}

	private async handleLoadFontMessage(message: LoadFontMessage): Promise<void> {
		try {
			const fallbackName = message.fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
			const metadata = await this.textmode.loadFontFromBuffer(
				message.buffer,
				message.mimeType,
				fallbackName.length > 0 ? fallbackName : null
			);

			this.transport.send({
				type: 'FONT_LOADED',
				requestId: message.requestId,
				familyName: metadata.familyName,
				characters: metadata.characters,
			});
		} catch (error) {
			this.transport.send({
				type: 'FONT_ERROR',
				requestId: message.requestId,
				message: error instanceof Error ? error.message : String(error),
			});
		}
	}

	private handlePlaybackMessage(message: PlaybackMessage): void {
		const state = this.textmode.applyPlaybackCommand({
			action: message.action,
			frame: message.frame,
			maxFrames: message.maxFrames,
		});

		this.transport.send({
			type: 'PLAYBACK_STATE',
			requestId: message.requestId,
			state,
		});

		if (state.isPlaying) {
			this.startPlaybackMonitor();
		} else {
			this.stopPlaybackMonitor();
		}
	}

	private sendPlaybackState(requestId?: string): void {
		this.transport.send({
			type: 'PLAYBACK_STATE',
			requestId,
			state: this.textmode.getPlaybackState(),
		});
	}

	private startPlaybackMonitor(): void {
		if (this.playbackMonitorId !== null) return;

		this.lastPlaybackFrameSent = this.textmode.getPlaybackState().frame;
		this.lastPlaybackStateSentAt = performance.now();

		const tick = (timestamp: number) => {
			let state = this.textmode.getPlaybackState();
			if (!state.isPlaying) {
				this.stopPlaybackMonitor();
				this.sendPlaybackState();
				return;
			}

			if (state.frame >= state.maxFrames - 1) {
				this.textmode.applyPlaybackCommand({ action: 'seek', frame: 0 });
				state = this.textmode.getPlaybackState();
			}

			if (state.frame !== this.lastPlaybackFrameSent || timestamp - this.lastPlaybackStateSentAt >= 1000) {
				this.lastPlaybackStateSentAt = timestamp;
				this.lastPlaybackFrameSent = state.frame;
				this.sendPlaybackState();
			}

			this.playbackMonitorId = requestAnimationFrame(tick);
		};

		this.playbackMonitorId = requestAnimationFrame(tick);
	}

	private stopPlaybackMonitor(): void {
		if (this.playbackMonitorId === null) return;
		cancelAnimationFrame(this.playbackMonitorId);
		this.playbackMonitorId = null;
		this.lastPlaybackFrameSent = -1;
	}

	private normalizeProgress(progress: unknown): { state: string; frameIndex?: number; totalFrames?: number; message?: string } {
		if (typeof progress !== 'object' || progress === null) {
			return { state: 'recording' };
		}

		const record = progress as Record<string, unknown>;
		return {
			state: typeof record.state === 'string' ? record.state : 'recording',
			frameIndex: typeof record.frameIndex === 'number' ? record.frameIndex : undefined,
			totalFrames: typeof record.totalFrames === 'number' ? record.totalFrames : undefined,
			message: typeof record.message === 'string' ? record.message : undefined,
		};
	}
}
