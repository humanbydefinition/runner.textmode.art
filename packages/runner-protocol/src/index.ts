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

export {
	EXPORT_FORMATS,
	createRunnerCapabilities,
	type ExportFormat,
	type RunnerCapabilities,
} from './capabilities';
export {
	type ExportProgress,
	type ExportRequest,
	type GifExportOptions,
	type ImageExportFormat,
	type ImageExportOptions,
	type SvgExportOptions,
	type TxtExportOptions,
	type WebmExportOptions,
} from './exports';
export {
	isInitMessage,
	isParentMessage,
	isRunnerCapabilities,
	isRunnerMessage,
} from './guards';
export {
	type ConfigureRuntimeMessage,
	type DisposeMessage,
	type ExportMessage,
	type ExportProgressMessage,
	type ExportResultMessage,
	type FontErrorMessage,
	type FontLoadedMessage,
	type InitMessage,
	type LoadFontMessage,
	type Message,
	type ParentToRunnerMessage,
	type PingMessage,
	type PlaybackMessage,
	type PlaybackStateMessage,
	type PongMessage,
	type ReadyMessage,
	type RunCodeMessage,
	type RunErrorMessage,
	type RunOkMessage,
	type RunnerToParentMessage,
	type SetSettingsMessage,
	type SoftResetMessage,
	type SynthErrorMessage,
	type ToggleUIMessage,
	type UserInteractionMessage,
	type WindowToRunnerMessage,
} from './messages';
export { type PlaybackAction, type PlaybackState } from './playback';
export { type RuntimeSettings } from './runtime';
