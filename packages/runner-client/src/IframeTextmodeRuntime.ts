import {
	isRunnerCapabilities,
	type ExportMessage,
	type ExportResultMessage,
	type FontLoadedMessage,
	type FontMetadataMessage,
	type GifExportOptions,
	type ImageExportOptions,
	type InitMessage,
	type ParentToRunnerMessage,
	type PlaybackAction,
	type PlaybackMessage,
	type PlaybackState,
	type PlaybackStateMessage,
	type ReadyMessage,
	type RunErrorMessage,
	type RunnerCapabilities,
	type RunnerToParentMessage,
	type RunOkMessage,
	type RuntimeSettings,
	type SvgExportOptions,
	type TxtExportOptions,
	type WebmExportOptions,
} from '@textmode/runner-protocol';
import { RunnerRequestError } from './errors';
import type { FontLoadResult } from './font';
import {
	DEFAULT_IFRAME_SANDBOX_TOKENS,
	type IframeMountMode,
	type IframeSandboxToken,
	type IframeTextmodeRuntimeOptions,
} from './options';
import type { RunnerRuntimeStatus } from './status';
import { HeartbeatController } from './internal/heartbeat';
import { createRunnerIframe, focusElement, mountRunnerIframe } from './internal/iframeMount';
import { routeRunnerMessage } from './internal/messageRouter';
import { RequestRegistry, requestKindForMessage } from './internal/requestRegistry';
import { assertSandboxOriginPolicy } from './internal/sandboxPolicy';
import { createDocumentVisibilityApi, type PageVisibilityApi } from './internal/visibility';

const getRuntimeErrorMessage = (error: unknown, fallback: string): string => {
	if (error instanceof Error && error.message) {
		return error.message;
	}
	if (typeof error === 'string' && error.trim()) {
		return error;
	}
	return fallback;
};

/**
 * Browser iframe runtime for communicating with the hosted textmode runner.
 *
 * @category Runtime
 */
export class IframeTextmodeRuntime {
	private readonly runnerHref: string;
	private readonly runnerOrigin: string;
	private readonly sandboxTokens: IframeSandboxToken[];
	private readonly handshakeTimeoutMs: number;
	private readonly requestTimeoutMs: number;
	private readonly options: IframeTextmodeRuntimeOptions;
	private readonly mountMode: IframeMountMode;
	private readonly pending: RequestRegistry;
	private readonly heartbeat: HeartbeatController;
	private readonly visibility: PageVisibilityApi;
	private iframe: HTMLIFrameElement | null = null;
	private channel: MessageChannel | null = null;
	private port: MessagePort | null = null;
	private container: HTMLElement | null = null;
	private settings: RuntimeSettings | null = null;
	private capabilities: RunnerCapabilities | null = null;
	private ready = false;
	private currentStatus: RunnerRuntimeStatus = 'idle';
	private readyResolver: ((value: boolean) => void) | null = null;
	private readyRejecter: ((reason: Error) => void) | null = null;
	private readyTimeoutId: number | null = null;
	private lastRequestedCode: string | null = null;

	constructor(options: IframeTextmodeRuntimeOptions) {
		this.options = options;
		this.mountMode = options.mountMode ?? 'replace';
		const runnerLocation = new URL(options.runnerUrl, window.location.href);
		this.runnerHref = runnerLocation.href;
		this.runnerOrigin = runnerLocation.origin;
		this.sandboxTokens = [...(options.sandboxTokens ?? DEFAULT_IFRAME_SANDBOX_TOKENS)];
		this.handshakeTimeoutMs = options.handshakeTimeoutMs ?? 5000;
		this.requestTimeoutMs = options.requestTimeoutMs ?? 12000;
		this.visibility = createDocumentVisibilityApi();
		this.pending = new RequestRegistry(undefined, this.visibility);
		this.heartbeat = new HeartbeatController({
			intervalMs: options.heartbeatIntervalMs ?? 2000,
			timeoutMs: options.heartbeatTimeoutMs ?? 10000,
			visibilityApi: this.visibility,
			onPing: () => {
				this.postMessage({
					type: 'PING',
					nonce: this.createRequestId('ping'),
				});
			},
			onTimeout: () => {
				this.handleUnavailable('runner heartbeat timed out');
			},
		});
	}

	/**
	 * Whether the runner iframe is ready to accept requests.
	 *
	 * @category Runtime
	 */
	get isReady(): boolean {
		return this.ready && this.currentStatus === 'ready';
	}

	/**
	 * Current runner iframe element, when mounted.
	 *
	 * @category Runtime
	 */
	get frame(): HTMLIFrameElement | null {
		return this.iframe;
	}

	/**
	 * Current runner lifecycle status.
	 *
	 * @category Runtime
	 */
	get status(): RunnerRuntimeStatus {
		return this.currentStatus;
	}

	/**
	 * Alias for {@link IframeTextmodeRuntime.status}.
	 *
	 * @category Runtime
	 */
	get runnerStatus(): RunnerRuntimeStatus {
		return this.currentStatus;
	}

	/**
	 * Capabilities advertised by the connected runner.
	 *
	 * @category Runtime
	 */
	get advertisedCapabilities(): RunnerCapabilities | null {
		return this.capabilities;
	}

	/**
	 * Mounts the runner iframe and performs the current protocol handshake.
	 *
	 * @param container - DOM element that should contain the runner iframe.
	 * @param settings - Optional fixed runtime settings to configure after ready.
	 * @returns `true` when the runner is ready.
	 * @category Runtime
	 */
	async init(container: HTMLElement, settings?: RuntimeSettings): Promise<boolean> {
		this.container = container;
		this.settings = settings ? { ...settings } : null;
		this.assertSandboxOriginPolicy();

		if (this.isReady && this.iframe?.isConnected) {
			if (settings) {
				await this.configure(settings);
			}
			return true;
		}

		this.disposeFrame();
		this.ready = false;
		this.setStatus('connecting');

		const iframe = createRunnerIframe(this.runnerHref, this.sandboxTokens);
		this.iframe = iframe;
		mountRunnerIframe(container, iframe, this.mountMode);

		const readyPromise = new Promise<boolean>((resolve, reject) => {
			this.readyResolver = resolve;
			this.readyRejecter = reject;
			this.readyTimeoutId = window.setTimeout(() => {
				const error = new Error('runner handshake timed out');
				this.handleUnavailable(error.message);
				reject(error);
			}, this.handshakeTimeoutMs);
		});

		iframe.addEventListener(
			'load',
			() => {
				this.connectPort();
			},
			{ once: true }
		);

		return readyPromise;
	}

	/**
	 * Disposes the iframe connection and rejects pending requests.
	 *
	 * @category Runtime
	 */
	dispose(): void {
		if (this.port) {
			try {
				this.postMessage({ type: 'DISPOSE' });
			} catch {
				// The connection may already be gone during page teardown.
			}
		}

		this.pending.rejectAll(new Error('runner disposed'));
		this.heartbeat.stop();
		this.disposeFrame();
		this.ready = false;
		this.setStatus('idle');
		this.readyResolver = null;
		this.readyRejecter = null;
	}

	/**
	 * Recreates the iframe and reruns the last requested code when available.
	 *
	 * @returns `true` when reconnection succeeds.
	 * @category Runtime
	 */
	async reconnect(): Promise<boolean> {
		if (!this.container) {
			return false;
		}

		const code = this.lastRequestedCode;
		this.setStatus('recovering');
		this.forceDisposeFrameForReconnect();
		const initialized = await this.init(this.container, this.settings ?? undefined);
		if (initialized && code) {
			void this.runCode(code);
		}
		return initialized;
	}

	/**
	 * Focuses the iframe from a host user gesture.
	 *
	 * Some browsers use this to unlock normal iframe animation cadence.
	 *
	 * @category Runtime
	 */
	activateFromUserGesture(): void {
		if (!this.iframe) return;
		this.iframe.tabIndex = -1;
		focusElement(this.iframe);

		try {
			this.iframe.contentWindow?.focus();
		} catch {
			// Element focus still helps browsers that gate iframe animation cadence.
		}
	}

	/**
	 * Configures complete fixed runtime settings.
	 *
	 * @category Runtime
	 */
	async configure(settings: RuntimeSettings): Promise<PlaybackState | null> {
		this.settings = { ...settings };
		const wasReady = this.ready;
		this.setStatus('configuring');
		return this.request<PlaybackStateMessage>({
			type: 'CONFIGURE_RUNTIME',
			requestId: this.createRequestId('settings'),
			settings,
		}).then((message) => {
			if (wasReady) {
				this.setStatus('ready');
			}
			return message.state;
		});
	}

	/**
	 * Applies a partial runtime settings update.
	 *
	 * @category Runtime
	 */
	async setSettings(settings: Partial<RuntimeSettings>): Promise<PlaybackState | null> {
		this.settings = {
			...(this.settings ?? (settings as RuntimeSettings)),
			...settings,
		} as RuntimeSettings;
		return this.request<PlaybackStateMessage>({
			type: 'SET_SETTINGS',
			requestId: this.createRequestId('settings'),
			settings,
		}).then((message) => message.state);
	}

	/**
	 * Executes code in the runner.
	 *
	 * @category Runtime
	 */
	async runCode(code: string, options: { softReset?: boolean } = {}): Promise<boolean> {
		this.lastRequestedCode = code;
		const requestId = this.createRequestId('run');
		const message = options.softReset
			? ({ type: 'SOFT_RESET', requestId, code } as const)
			: ({ type: 'RUN_CODE', requestId, code } as const);

		await this.request<RunOkMessage>(message);
		return true;
	}

	/**
	 * Exports the current runner output in any supported format.
	 *
	 * @category Exports
	 */
	async export(
		format: ExportMessage['format'],
		options?:
			| ImageExportOptions
			| SvgExportOptions
			| TxtExportOptions
			| GifExportOptions
			| WebmExportOptions,
		timeoutMs?: number
	): Promise<ExportResultMessage> {
		const message: ExportMessage = {
			type: 'EXPORT',
			requestId: this.createRequestId('export'),
			format,
			options,
		};

		return this.request<ExportResultMessage>(message, timeoutMs);
	}

	/**
	 * Exports the current runner output as a raster image.
	 *
	 * @category Exports
	 */
	async exportImage(options: ImageExportOptions): Promise<ExportResultMessage> {
		return this.export('image', options);
	}

	/**
	 * Exports the current runner output as SVG.
	 *
	 * @category Exports
	 */
	async exportSvg(options: SvgExportOptions): Promise<ExportResultMessage> {
		return this.export('svg', options);
	}

	/**
	 * Exports the current runner output as plain text.
	 *
	 * @category Exports
	 */
	async exportTxt(options: TxtExportOptions): Promise<ExportResultMessage> {
		return this.export('txt', options);
	}

	/**
	 * Records an animated GIF export.
	 *
	 * @category Exports
	 */
	async exportGif(options: GifExportOptions): Promise<ExportResultMessage> {
		return this.export('gif', options, Math.max(this.requestTimeoutMs, 120000));
	}

	/**
	 * Records a WebM export.
	 *
	 * @category Exports
	 */
	async exportWebm(options: WebmExportOptions): Promise<ExportResultMessage> {
		return this.export('webm', options, Math.max(this.requestTimeoutMs, 120000));
	}

	/**
	 * Loads a font file into the runner.
	 *
	 * @category Fonts
	 */
	async loadFont(file: File): Promise<FontLoadResult> {
		const requestId = this.createRequestId('font');
		const buffer = await file.arrayBuffer();
		const message = {
			type: 'LOAD_FONT',
			requestId,
			fileName: file.name,
			mimeType: file.type || undefined,
			buffer,
		} satisfies ParentToRunnerMessage;

		return this.request<FontLoadedMessage>(message, undefined, [buffer]).then((result) => ({
			familyName: result.familyName,
			characters: result.characters,
		}));
	}

	/**
	 * Reads metadata for the runner's active font.
	 *
	 * @category Fonts
	 */
	async getFontMetadata(): Promise<FontLoadResult> {
		const message = {
			type: 'GET_FONT_METADATA',
			requestId: this.createRequestId('font'),
		} satisfies ParentToRunnerMessage;

		return this.request<FontMetadataMessage>(message).then((result) => ({
			familyName: result.familyName,
			characters: result.characters,
		}));
	}

	/**
	 * Sends a playback command and resolves with the resulting playback state.
	 *
	 * @category Playback
	 */
	async playback(action: PlaybackAction, options: { frame?: number; maxFrames?: number } = {}): Promise<PlaybackState> {
		const message: PlaybackMessage = {
			type: 'PLAYBACK',
			requestId: this.createRequestId('playback'),
			action,
			frame: options.frame,
			maxFrames: options.maxFrames,
		};

		return this.request<PlaybackStateMessage>(message).then((result) => result.state);
	}

	private connectPort(): void {
		if (!this.iframe?.contentWindow) {
			this.handleUnavailable('runner frame is unavailable');
			return;
		}

		this.channel = new MessageChannel();
		this.port = this.channel.port1;
		this.port.onmessage = (event: MessageEvent<RunnerToParentMessage>) => {
			this.handlePortMessage(event.data);
		};
		this.port.start();

		const initMessage: InitMessage = {
			type: 'INIT',
		};
		this.iframe.contentWindow.postMessage(initMessage, this.runnerOrigin, [this.channel.port2]);
	}

	private handlePortMessage(message: unknown): void {
		routeRunnerMessage(message, {
			onReady: (readyMessage) => this.handleReady(readyMessage),
			onRunOk: (runOkMessage) => {
				const resolved = this.pending.resolve(runOkMessage.requestId, runOkMessage);
				if (!runOkMessage.requestId || resolved) {
					this.options.onRunOk?.(runOkMessage);
				}
			},
			onRunError: (runErrorMessage) => this.handleRunError(runErrorMessage),
			onSynthError: (synthErrorMessage) => {
				this.options.onSynthError?.(synthErrorMessage.message);
			},
			onToggleUI: () => {
				this.options.onToggleUI?.();
			},
			onUserInteraction: () => {
				this.options.onUserInteraction?.();
			},
			onExportProgress: (exportProgressMessage) => {
				this.options.onExportProgress?.(
					exportProgressMessage.requestId,
					exportProgressMessage.format,
					exportProgressMessage.progress
				);
			},
			onExportResult: (exportResultMessage) => {
				this.pending.resolve(exportResultMessage.requestId, exportResultMessage);
			},
			onFontLoaded: (fontLoadedMessage) => {
				this.pending.resolve(fontLoadedMessage.requestId, fontLoadedMessage);
			},
			onFontMetadata: (fontMetadataMessage) => {
				this.pending.resolve(fontMetadataMessage.requestId, fontMetadataMessage);
			},
			onFontError: (fontErrorMessage) => {
				this.pending.reject(fontErrorMessage.requestId, new Error(fontErrorMessage.message));
			},
			onPlaybackState: (playbackStateMessage) => {
				if (playbackStateMessage.requestId) {
					const resolved = this.pending.resolve(playbackStateMessage.requestId, playbackStateMessage);
					if (resolved) {
						this.options.onPlaybackState?.(playbackStateMessage.state);
					}
					return;
				}

				this.options.onPlaybackState?.(playbackStateMessage.state);
			},
			onPong: () => {
				this.heartbeat.markPong();
			},
		});
	}

	private handleReady(message: ReadyMessage): void {
		const protocolError = this.validateReadyMessage(message);
		if (protocolError) {
			this.handleUnavailable(protocolError);
			return;
		}

		this.capabilities = message.capabilities;

		if (this.readyTimeoutId !== null) {
			window.clearTimeout(this.readyTimeoutId);
			this.readyTimeoutId = null;
		}

		this.options.onConnected?.();

		const settings = this.settings;
		if (settings) {
			void this.configure(settings)
				.then(() => {
					this.markReady();
				})
				.catch((error) => {
					this.ready = false;
					this.setStatus('unavailable', getRuntimeErrorMessage(error, 'runner configuration failed'));
					this.readyRejecter?.(error);
					this.readyResolver = null;
					this.readyRejecter = null;
				});
		} else {
			this.markReady();
		}
	}

	private markReady(): void {
		this.ready = true;
		this.setStatus('ready');
		this.options.onReady?.(this.capabilities!);
		this.heartbeat.start();
		this.readyResolver?.(true);
		this.readyResolver = null;
		this.readyRejecter = null;
	}

	private handleRunError(message: RunErrorMessage): void {
		const error = new RunnerRequestError(message);

		if (message.requestId) {
			this.pending.reject(message.requestId, error);
			return;
		}

		this.options.onRunError?.({
			message: message.message,
			stack: message.stack,
			line: message.line,
			column: message.column,
		});
	}

	private request<T>(
		message: ParentToRunnerMessage,
		timeoutMs = this.requestTimeoutMs,
		transfer?: Transferable[]
	): Promise<T> {
		if (!this.port || (!this.ready && message.type !== 'CONFIGURE_RUNTIME')) {
			return Promise.reject(new Error('runner is not ready'));
		}

		const requestId = 'requestId' in message ? message.requestId : undefined;
		if (!requestId) {
			this.postMessage(message, transfer);
			return Promise.resolve(undefined as T);
		}

		const kind = requestKindForMessage(message.type);
		const promise = this.pending.register<T>({
			requestId,
			kind,
			messageType: message.type,
			timeoutMs,
			onTimeout: (error) => {
				if (kind === 'run') {
					return;
				}

				this.handleUnavailable(error.message);
			},
		});

		this.postMessage(message, transfer);
		return promise;
	}

	private postMessage(message: ParentToRunnerMessage, transfer?: Transferable[]): void {
		if (!this.port) {
			throw new Error('runner port is not connected');
		}

		if (transfer && transfer.length > 0) {
			this.port.postMessage(message, transfer);
		} else {
			this.port.postMessage(message);
		}
	}

	private handleUnavailable(reason: string): void {
		const error = new Error(reason);
		this.heartbeat.stop();
		this.ready = false;
		this.pending.rejectAll(error);
		this.readyRejecter?.(error);
		this.readyResolver = null;
		this.readyRejecter = null;
		this.disposeFrame();
		const status: RunnerRuntimeStatus = reason.includes('heartbeat') ? 'hung' : 'unavailable';
		this.setStatus(status, reason);
		this.options.onUnavailable?.(reason, status);
	}

	private forceDisposeFrameForReconnect(): void {
		if (this.port) {
			try {
				this.postMessage({ type: 'DISPOSE' });
			} catch {
				// The existing connection may already be unavailable.
			}
		}

		this.heartbeat.stop();
		this.pending.rejectAll(new Error('runner reconnecting'));
		this.ready = false;
		this.disposeFrame();
	}

	private validateReadyMessage(message: ReadyMessage): string | null {
		const capabilities = message.capabilities;

		if (!isRunnerCapabilities(capabilities)) {
			return 'runner did not advertise a valid current capability set';
		}

		if (!capabilities.runtimeConfig) {
			return 'runner does not support runtime configuration';
		}

		return null;
	}

	private assertSandboxOriginPolicy(): void {
		assertSandboxOriginPolicy({
			sandboxTokens: this.sandboxTokens,
			runnerOrigin: this.runnerOrigin,
			parentOrigin: window.location.origin,
		});
	}

	private setStatus(status: RunnerRuntimeStatus, reason: string | null = null): void {
		if (this.currentStatus === status && !reason) {
			return;
		}

		this.currentStatus = status;
		this.options.onStatusChange?.(status, reason);
	}

	private disposeFrame(): void {
		if (this.readyTimeoutId !== null) {
			window.clearTimeout(this.readyTimeoutId);
			this.readyTimeoutId = null;
		}

		this.port?.close();
		this.channel?.port1.close();
		this.channel?.port2.close();
		this.port = null;
		this.channel = null;

		if (this.iframe) {
			this.iframe.remove();
			this.iframe = null;
		}
	}

	private createRequestId(prefix: string): string {
		return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
	}
}
