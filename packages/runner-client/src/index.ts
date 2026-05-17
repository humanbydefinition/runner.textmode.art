/**
 * @packageDocumentation
 *
 * Browser iframe runtime client for the hosted textmode runner.
 *
 * `@textmode/runner-client` manages the runner iframe lifecycle, current
 * protocol handshake, request/response routing, heartbeat monitoring, export
 * helpers, font loading, playback control, reconnect, and disposal for host
 * apps.
 *
 * @module @textmode/runner-client
 */

export { IframeTextmodeRuntime } from './IframeTextmodeRuntime';
export { RunnerRequestError, type RunnerExecutionError } from './errors';
export { type FontLoadResult } from './font';
export {
	DEFAULT_IFRAME_SANDBOX_TOKENS,
	type IframeMountMode,
	type IframeSandboxToken,
	type IframeTextmodeRuntimeOptions,
} from './options';
export { type RunnerRuntimeStatus } from './status';
