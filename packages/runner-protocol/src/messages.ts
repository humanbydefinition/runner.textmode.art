import type { RunnerCapabilities } from './capabilities';

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
 * Runner-originated shortcut event requesting a fresh host runtime.
 *
 * @category Messages
 */
export interface HardResetMessage {
	type: 'HARD_RESET';
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
 * Runner request for a trusted interaction inside its cross-origin document.
 *
 * @category Messages
 */
export interface UserActivationRequiredMessage {
	type: 'USER_ACTIVATION_REQUIRED';
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

export interface CodeValidationResultMessage {
	type: 'CODE_VALIDATION_RESULT';
	requestId: string;
	valid: boolean;
	diagnostic?: { message: string; line?: number; column?: number };
}

export interface RuntimeSummaryResultMessage {
	type: 'RUNTIME_SUMMARY_RESULT';
	requestId: string;
	summary: RuntimeSummary;
}

export interface ArtworkInspectionResultMessage {
	type: 'ARTWORK_INSPECTION_RESULT';
	requestId: string;
	inspection: ArtworkInspection;
}

export interface ExportPreparedMessage {
	type: 'EXPORT_PREPARED';
	requestId: string;
	artifact: PreparedExportArtifact;
}

export interface RequestErrorMessage {
	type: 'REQUEST_ERROR';
	requestId: string;
	operation: 'validate' | 'summary' | 'inspect' | 'export';
	code: string;
	message: string;
}

export type RuntimeSummary = {
	sampledAt: string;
	canvas: { width: number; height: number };
	grid: { columns: number; rows: number };
	layers: Array<{ id: string; visible: boolean; opacity: number; blendMode: string }>;
};

export type ArtworkInspection = RuntimeSummary & {
	region?: { x: number; y: number; width: number; height: number };
	cells?: Array<{ x: number; y: number; ch: string; fg: string; bg: string }>;
	nextCursor?: number | null;
};

export type PreparedExportArtifact = {
	format: 'png' | 'svg' | 'txt' | 'json';
	mimeType: string;
	fileName: string;
	data: ArrayBuffer | string;
};

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
	| HardResetMessage
	| ToggleUIMessage
	| UserActivationRequiredMessage
	| UserInteractionMessage
	| PongMessage
	| CodeValidationResultMessage
	| RuntimeSummaryResultMessage
	| ArtworkInspectionResultMessage
	| ExportPreparedMessage
	| RequestErrorMessage;

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
 * Request to rebuild the textmode runtime inside the existing iframe document.
 *
 * @category Messages
 */
export interface ResetRuntimeMessage {
	type: 'RESET_RUNTIME';
	/** Source code to execute in the fresh textmode runtime. */
	code: string;
	/** Request identifier used for result routing. */
	requestId: string;
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
 * Fire-and-forget audio analysis frame sent by a host app.
 *
 * Values use the Web Audio byte analyser convention:
 * frequency bins and waveform samples are integers in the 0-255 range.
 *
 * @category Messages
 */
export interface AudioDataMessage {
	type: 'AUDIO_DATA';
	/** Frequency-domain FFT data. */
	fft: Uint8Array;
	/** Time-domain waveform data. */
	waveform: Uint8Array;
	/** Host-side capture timestamp. */
	timestamp: number;
}

export interface ValidateCodeMessage {
	type: 'VALIDATE_CODE';
	requestId: string;
	code: string;
}

export interface GetRuntimeSummaryMessage {
	type: 'GET_RUNTIME_SUMMARY';
	requestId: string;
}

export interface InspectArtworkMessage {
	type: 'INSPECT_ARTWORK';
	requestId: string;
	detail: 'summary' | 'cells';
	layerId?: string;
	region?: { x: number; y: number; width: number; height: number };
	cursor?: number;
}

export interface PrepareExportMessage {
	type: 'PREPARE_EXPORT';
	requestId: string;
	format: 'png' | 'svg' | 'txt' | 'json';
	target: 'selected' | 'all';
	fileName?: string;
}

/**
 * Messages sent from a host app to the runner after handshake.
 *
 * @category Messages
 */
export type ParentToRunnerMessage =
	| RunCodeMessage
	| ResetRuntimeMessage
	| DisposeMessage
	| PingMessage
	| AudioDataMessage
	| ValidateCodeMessage
	| GetRuntimeSummaryMessage
	| InspectArtworkMessage
	| PrepareExportMessage;

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
