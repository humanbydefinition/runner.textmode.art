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
	| AudioDataMessage;

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
