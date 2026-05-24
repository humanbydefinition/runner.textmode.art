import type { RunnerCapabilities } from './capabilities';
import type { ExportProgress, ExportRequest } from './exports';
import type { PlaybackAction, PlaybackState } from './playback';
import type { RuntimeSettings } from './runtime';

/**
 * Initial window message sent by a host app to the runner iframe.
 *
 * @category Messages
 */
export interface InitMessage {
	type: 'INIT';
}

/**
 * Runner readiness message sent after a successful iframe handshake.
 *
 * @category Messages
 */
export interface ReadyMessage {
	type: 'READY';
	/** Feature set supported by this runner. */
	capabilities: RunnerCapabilities;
}

/**
 * Successful code execution result.
 *
 * @category Messages
 */
export interface RunOkMessage {
	type: 'RUN_OK';
	/** Runner-side completion timestamp. */
	timestamp: number;
	/** Request identifier when the run was initiated by a request/response host. */
	requestId?: string;
}

/**
 * Code execution failure result.
 *
 * @category Messages
 */
export interface RunErrorMessage {
	type: 'RUN_ERROR';
	/** Human-readable error message. */
	message: string;
	/** Optional stack trace. */
	stack?: string;
	/** Optional 1-based source line. */
	line?: number;
	/** Optional 1-based source column. */
	column?: number;
	/** Request identifier when the failure belongs to a request/response call. */
	requestId?: string;
}

/**
 * Shader synth parameter error reported by the runner.
 *
 * @category Messages
 */
export interface SynthErrorMessage {
	type: 'SYNTH_ERROR';
	/** Human-readable error message. */
	message: string;
	/** Uniform name associated with the error, when available. */
	uniformName?: string;
}

/**
 * Runner-originated shortcut event requesting host UI visibility changes.
 *
 * @category Messages
 */
export interface ToggleUIMessage {
	type: 'TOGGLE_UI';
}

/**
 * Runner-originated user interaction event.
 *
 * @category Messages
 */
export interface UserInteractionMessage {
	type: 'USER_INTERACTION';
}

/**
 * Export completion payload.
 *
 * @category Messages
 */
export interface ExportResultMessage {
	type: 'EXPORT_RESULT';
	/** Request identifier for the export call. */
	requestId: string;
	/** Completed export format. */
	format: ExportRequest['format'];
	/** Binary export result for blob-based formats. */
	blob?: Blob;
	/** Text export result for text-based formats. */
	text?: string;
	/** Suggested filename, when provided by the runner. */
	filename?: string;
	/** MIME type for the export result. */
	mimeType?: string;
}

/**
 * Progress payload for multi-frame exports.
 *
 * @category Messages
 */
export interface ExportProgressMessage {
	type: 'EXPORT_PROGRESS';
	/** Request identifier for the export call. */
	requestId: string;
	/** Streaming export format. */
	format: 'gif' | 'webm';
	/** Current progress snapshot. */
	progress: ExportProgress;
}

/**
 * Successful font load result.
 *
 * @category Messages
 */
export interface FontLoadedMessage {
	type: 'FONT_LOADED';
	/** Request identifier for the font load call. */
	requestId: string;
	/** Font family name detected by the runner. */
	familyName: string | null;
	/** Characters available in the loaded font. */
	characters: string[];
}

/**
 * Current active font metadata.
 *
 * @category Messages
 */
export interface FontMetadataMessage {
	type: 'FONT_METADATA';
	/** Request identifier for the metadata request. */
	requestId: string;
	/** Active font family name detected by the runner. */
	familyName: string | null;
	/** Characters available in the active font. */
	characters: string[];
}

/**
 * Font load or metadata failure result.
 *
 * @category Messages
 */
export interface FontErrorMessage {
	type: 'FONT_ERROR';
	/** Request identifier for the font request. */
	requestId: string;
	/** Human-readable error message. */
	message: string;
}

/**
 * Playback state response or event.
 *
 * @category Messages
 */
export interface PlaybackStateMessage {
	type: 'PLAYBACK_STATE';
	/** Request identifier when the state belongs to a playback request. */
	requestId?: string;
	/** Current playback state. */
	state: PlaybackState;
}

/**
 * Heartbeat response from the runner.
 *
 * @category Messages
 */
export interface PongMessage {
	type: 'PONG';
	/** Echoed heartbeat nonce. */
	nonce?: string;
	/** Runner-side response timestamp. */
	timestamp: number;
}

/**
 * Messages sent from the runner iframe to a host app.
 *
 * @category Messages
 */
export type RunnerToParentMessage =
	| ReadyMessage
	| RunOkMessage
	| RunErrorMessage
	| SynthErrorMessage
	| ToggleUIMessage
	| UserInteractionMessage
	| ExportResultMessage
	| ExportProgressMessage
	| FontLoadedMessage
	| FontMetadataMessage
	| FontErrorMessage
	| PlaybackStateMessage
	| PongMessage;

/**
 * Request to execute code in the runner.
 *
 * @category Messages
 */
export interface RunCodeMessage {
	type: 'RUN_CODE';
	/** Source code to execute. */
	code: string;
	/** Optional request identifier for result routing. */
	requestId?: string;
}

/**
 * Request to reset frame state and execute code.
 *
 * @category Messages
 */
export interface SoftResetMessage {
	type: 'SOFT_RESET';
	/** Source code to execute after soft reset. */
	code: string;
	/** Optional request identifier for result routing. */
	requestId?: string;
}

/**
 * Request to dispose the runner runtime.
 *
 * @category Messages
 */
export interface DisposeMessage {
	type: 'DISPOSE';
}

/**
 * Request to initialize or reconfigure fixed runtime settings.
 *
 * @category Messages
 */
export interface ConfigureRuntimeMessage {
	type: 'CONFIGURE_RUNTIME';
	/** Complete runtime settings. */
	settings: RuntimeSettings;
	/** Optional request identifier for result routing. */
	requestId?: string;
}

/**
 * Request to update part of the current runtime settings.
 *
 * @category Messages
 */
export interface SetSettingsMessage {
	type: 'SET_SETTINGS';
	/** Partial runtime settings to apply. */
	settings: Partial<RuntimeSettings>;
	/** Optional request identifier for result routing. */
	requestId?: string;
}

/**
 * Request to export the current runner output.
 *
 * @category Messages
 */
export interface ExportMessage {
	type: 'EXPORT';
	/** Request identifier for result routing. */
	requestId: string;
	/** Requested export format. */
	format: ExportRequest['format'];
	/** Export options matching the requested format. */
	options?: ExportRequest['options'];
}

/**
 * Request to load a font file into the runner.
 *
 * @category Messages
 */
export interface LoadFontMessage {
	type: 'LOAD_FONT';
	/** Request identifier for result routing. */
	requestId: string;
	/** Original file name. */
	fileName: string;
	/** Browser-reported MIME type, when available. */
	mimeType?: string;
	/** Font file bytes. */
	buffer: ArrayBuffer;
}

/**
 * Request metadata for the runner's active font.
 *
 * @category Messages
 */
export interface GetFontMetadataMessage {
	type: 'GET_FONT_METADATA';
	/** Request identifier for result routing. */
	requestId: string;
}

/**
 * Request to control or inspect playback.
 *
 * @category Messages
 */
export interface PlaybackMessage {
	type: 'PLAYBACK';
	/** Optional request identifier for result routing. */
	requestId?: string;
	/** Playback action to perform. */
	action: PlaybackAction;
	/** Target frame for seek-like actions. */
	frame?: number;
	/** Maximum frame count for playback range updates. */
	maxFrames?: number;
}

/**
 * Heartbeat request sent by a host app.
 *
 * @category Messages
 */
export interface PingMessage {
	type: 'PING';
	/** Optional nonce echoed by the runner. */
	nonce?: string;
}

/**
 * Messages sent from a host app to the runner after handshake.
 *
 * @category Messages
 */
export type ParentToRunnerMessage =
	| RunCodeMessage
	| SoftResetMessage
	| DisposeMessage
	| ConfigureRuntimeMessage
	| SetSettingsMessage
	| ExportMessage
	| LoadFontMessage
	| GetFontMetadataMessage
	| PlaybackMessage
	| PingMessage;

/**
 * Messages sent to the runner iframe window before MessagePort attachment.
 *
 * @category Messages
 */
export type WindowToRunnerMessage = InitMessage;

/**
 * Any message in the runner protocol.
 *
 * @category Messages
 */
export type Message = RunnerToParentMessage | ParentToRunnerMessage | WindowToRunnerMessage;
