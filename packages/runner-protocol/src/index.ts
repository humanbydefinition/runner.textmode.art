/**
 * @packageDocumentation
 *
 * Shared message protocol for the textmode runner iframe.
 *
 * `@textmode/runner-protocol` is the single source of truth for the wire
 * contract used by the hosted runner and browser host apps.
 * Runtime protocol version negotiation is intentionally absent: package semver
 * describes source compatibility, while this package describes the one current
 * message shape. Feature availability is advertised through capabilities.
 *
 * @module @textmode/runner-protocol
 */

export { createRunnerCapabilities, type RunnerCapabilities } from './capabilities';
export {
	isInitMessage,
	isParentMessage,
	isRunnerCapabilities,
	isRunnerMessage,
} from './guards';
export {
	type DisposeMessage,
	type InitMessage,
	type Message,
	type ParentToRunnerMessage,
	type PingMessage,
	type PongMessage,
	type ReadyMessage,
	type RunCodeMessage,
	type RunErrorMessage,
	type RunOkMessage,
	type RunnerToParentMessage,
	type SoftResetMessage,
	type SynthErrorMessage,
	type ToggleUIMessage,
	type UserInteractionMessage,
	type WindowToRunnerMessage,
} from './messages';
