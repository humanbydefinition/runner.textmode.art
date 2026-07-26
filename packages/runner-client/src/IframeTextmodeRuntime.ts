import {
	isRunnerCapabilities,
	type AudioDataMessage,
	type InitMessage,
	type ParentToRunnerMessage,
	type ReadyMessage,
	type RunErrorMessage,
	type RunnerCapabilities,
	type RunnerToParentMessage,
	type RunOkMessage,
} from '@textmode/runner-protocol';
import { RunnerRequestError } from './errors';
import {
	DEFAULT_IFRAME_SANDBOX_TOKENS,
	type IframeMountMode,
	type IframeSandboxToken,
	type IframeTextmodeRuntimeOptions,
	type RunnerProbeOptions,
	type RunnerReconnectOptions,
} from './options';
import type { RunnerRuntimeStatus } from './status';
import { HeartbeatController } from './internal/heartbeat';
import { createRunnerIframe, focusElement, mountRunnerIframe } from './internal/iframeMount';
import { routeRunnerMessage } from './internal/messageRouter';
import { RequestRegistry, requestKindForMessage } from './internal/requestRegistry';
import { assertSandboxOriginPolicy } from './internal/sandboxPolicy';
import { createDocumentVisibilityApi, type PageVisibilityApi } from './internal/visibility';

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
	 * @returns `true` when the runner is ready.
	 * @category Runtime
	 */
	async init(container: HTMLElement): Promise<boolean> {
		this.container = container;
		try {
			this.assertSandboxOriginPolicy();
		} catch (error) {
			const reason = error instanceof Error ? error.message : String(error);
			this.handleUnavailable(reason);
			throw error;
		}

		if (this.isReady && this.iframe?.isConnected) {
			return true;
		}

		this.rejectPendingHandshake('runner initialization superseded');
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
				if (this.iframe !== iframe) return;
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
		this.rejectPendingHandshake('runner disposed');
		this.disposeFrame();
		this.ready = false;
		this.setStatus('idle');
		this.readyResolver = null;
		this.readyRejecter = null;
	}

	/**
	 * Recreates the iframe and optionally reruns the last requested code.
	 *
	 * @param options - Reconnect behavior. The last code is rerun by default.
	 * @returns `true` when reconnection succeeds.
	 * @category Runtime
	 */
	async reconnect(options: RunnerReconnectOptions = {}): Promise<boolean> {
		if (!this.container) {
			return false;
		}

		const code = options.rerun === false ? null : this.lastRequestedCode;
		this.setStatus('recovering');
		this.forceDisposeFrameForReconnect();
		const initialized = await this.init(this.container);
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
	 * Executes code in the runner.
	 *
	 * @category Runtime
	 */
	async runCode(code: string): Promise<boolean> {
		const requestId = this.createRequestId('run');
		const message = { type: 'RUN_CODE', requestId, code } as const;

		await this.request<RunOkMessage>(message);
		this.lastRequestedCode = code;
		return true;
	}

	/**
	 * Executes code as a transactional candidate.
	 *
	 * Failed and timed-out probes do not replace the code used by reconnect.
	 *
	 * @category Runtime
	 */
	async probeCode(code: string, options: RunnerProbeOptions = {}): Promise<boolean> {
		const requestId = this.createRequestId('probe');
		const message = { type: 'RUN_CODE', requestId, code } as const;

		await this.request<RunOkMessage>(message, options.timeoutMs ?? this.requestTimeoutMs);
		this.lastRequestedCode = code;
		return true;
	}

	/**
	 * Rebuilds the textmode runtime while preserving the current iframe document.
	 *
	 * Older runners fall back to a full reconnect followed by one code execution.
	 *
	 * @category Runtime
	 */
	async resetRuntime(code: string): Promise<boolean> {
		if (this.capabilities?.runtimeReset !== true) {
			const reconnected = await this.reconnect({ rerun: false });
			return reconnected ? this.runCode(code) : false;
		}

		const requestId = this.createRequestId('reset');
		await this.request<RunOkMessage>({ type: 'RESET_RUNTIME', requestId, code });
		this.lastRequestedCode = code;
		return true;
	}

	/**
	 * Sends a fire-and-forget audio analysis frame to the runner.
	 *
	 * Audio frames are intentionally not request-tracked: hosts may send them at
	 * animation-frame cadence, and stale frames can be safely dropped.
	 *
	 * @category Runtime
	 */
	sendAudioData(data: Omit<AudioDataMessage, 'type'>): boolean {
		if (!this.port || !this.ready) {
			return false;
		}

		this.postMessage({
			type: 'AUDIO_DATA',
			fft: data.fft,
			waveform: data.waveform,
			timestamp: data.timestamp,
		});
		return true;
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
			onHardReset: () => {
				this.options.onHardReset?.();
			},
			onToggleUI: () => {
				this.options.onToggleUI?.();
			},
			onUserActivationRequired: () => {
				this.options.onUserActivationRequired?.();
			},
			onUserInteraction: () => {
				this.options.onUserInteraction?.();
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
		this.markReady();
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

	private request<T>(message: ParentToRunnerMessage, timeoutMs = this.requestTimeoutMs): Promise<T> {
		if (!this.port || !this.ready) {
			return Promise.reject(new Error('runner is not ready'));
		}

		const requestId = 'requestId' in message ? message.requestId : undefined;
		if (!requestId) {
			this.postMessage(message);
			return Promise.resolve(undefined as T);
		}

		const kind = requestKindForMessage(message.type);
		const promise = this.pending.register<T>({
			requestId,
			messageType: message.type,
			timeoutMs,
			onTimeout: (error) => {
				if (kind === 'run') {
					return;
				}

				this.handleUnavailable(error.message);
			},
		});

		this.postMessage(message);
		return promise;
	}

	private postMessage(message: ParentToRunnerMessage): void {
		if (!this.port) {
			throw new Error('runner port is not connected');
		}

		this.port.postMessage(message);
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
		const status: RunnerRuntimeStatus = reason === 'runner heartbeat timed out' ? 'hung' : 'unavailable';
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
		this.rejectPendingHandshake('runner reconnecting');
		this.ready = false;
		this.disposeFrame();
	}

	private validateReadyMessage(message: ReadyMessage): string | null {
		const capabilities = message.capabilities;

		if (!isRunnerCapabilities(capabilities)) {
			return 'runner did not advertise a valid current capability set';
		}

		if (!capabilities.heartbeat) {
			return 'runner does not support heartbeat monitoring';
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

	private rejectPendingHandshake(reason: string): void {
		if (!this.readyRejecter && !this.readyResolver) {
			return;
		}

		if (this.readyTimeoutId !== null) {
			window.clearTimeout(this.readyTimeoutId);
			this.readyTimeoutId = null;
		}

		this.readyRejecter?.(new Error(reason));
		this.readyResolver = null;
		this.readyRejecter = null;
	}

	private createRequestId(prefix: string): string {
		return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
	}
}
