import type {
	ExportProgress,
	PlaybackState,
	RunnerCapabilities,
	RunOkMessage,
} from '@textmode/runner-protocol';
import type { RunnerExecutionError } from './errors';
import type { RunnerRuntimeStatus } from './status';

/**
 * Iframe sandbox token supported by the runner client.
 *
 * @category Options
 */
export type IframeSandboxToken = 'allow-downloads' | 'allow-same-origin' | 'allow-scripts';

/**
 * How the runner iframe should be mounted into its container.
 *
 * @category Options
 */
export type IframeMountMode = 'append' | 'replace';

/**
 * Default sandbox tokens used by the runner iframe.
 *
 * The default deliberately excludes `allow-downloads`; downloads should be
 * initiated by the host app after receiving export results.
 *
 * @category Options
 */
export const DEFAULT_IFRAME_SANDBOX_TOKENS: readonly IframeSandboxToken[] = [
	'allow-scripts',
	// The runner is served from a separate origin in dev and production. Keeping
	// same-origin inside that isolated origin preserves runner asset behavior
	// without giving it parent DOM access.
	'allow-same-origin',
];

/**
 * Options for {@link IframeTextmodeRuntime}.
 *
 * @category Options
 */
export interface IframeTextmodeRuntimeOptions {
	/** Absolute or parent-relative URL for the hosted runner app. */
	runnerUrl: string;
	/** Iframe mount behavior. Defaults to `replace`. */
	mountMode?: IframeMountMode;
	/** Sandbox tokens applied to the runner iframe. */
	sandboxTokens?: IframeSandboxToken[];
	/** Timeout for the initial iframe MessagePort handshake. */
	handshakeTimeoutMs?: number;
	/** Default timeout for request/response runner messages. */
	requestTimeoutMs?: number;
	/** Interval between heartbeat pings. */
	heartbeatIntervalMs?: number;
	/** Maximum time without a heartbeat pong before the runner is marked hung. */
	heartbeatTimeoutMs?: number;
	/** Called after the runner is ready and optional runtime configuration succeeds. */
	onReady?: (capabilities: RunnerCapabilities) => void;
	/** Called when code execution succeeds. */
	onRunOk?: (message: RunOkMessage) => void;
	/** Called for non-request-scoped runner execution errors. */
	onRunError?: (error: RunnerExecutionError) => void;
	/** Called when the runner reports a synth parameter error. */
	onSynthError?: (message: string) => void;
	/** Called when the runner requests host UI visibility changes. */
	onToggleUI?: () => void;
	/** Called when the runner reports user interaction. */
	onUserInteraction?: () => void;
	/** Called as multi-frame exports report progress. */
	onExportProgress?: (requestId: string, format: 'gif' | 'webm', progress: ExportProgress) => void;
	/** Called whenever the runner reports playback state. */
	onPlaybackState?: (state: PlaybackState) => void;
	/** Called when the runner becomes unavailable or hung. */
	onUnavailable?: (reason: string, status: RunnerRuntimeStatus) => void;
	/** Called after the MessagePort connection is established. */
	onConnected?: () => void;
	/** Called whenever runtime lifecycle status changes. */
	onStatusChange?: (status: RunnerRuntimeStatus, reason?: string | null) => void;
}
