import type { RunnerCapabilities } from './capabilities';
import type { InitMessage, ParentToRunnerMessage, RunnerToParentMessage } from './messages';
import {
	isBoundedUint8Array,
	isFiniteNumber,
	isMessageRecord,
	isOptionalFiniteNumber,
	isOptionalString,
} from './guards.internal';

const MAX_AUDIO_FFT_BINS = 4096;
const MAX_AUDIO_WAVEFORM_SAMPLES = 8192;

/**
 * Checks whether a value is a valid current runner-to-host message.
 *
 * @category Guards
 */
export function isRunnerMessage(msg: unknown): msg is RunnerToParentMessage {
	if (!isMessageRecord(msg)) return false;

	switch (msg.type) {
		case 'READY':
			return !('v' in msg) && isRunnerCapabilities(msg.capabilities);
		case 'HARD_RESET':
		case 'TOGGLE_UI':
		case 'USER_INTERACTION':
			return true;
		case 'RUN_OK':
			return isFiniteNumber(msg.timestamp) && isOptionalString(msg.requestId);
		case 'RUN_ERROR':
			return (
				typeof msg.message === 'string' &&
				isOptionalString(msg.stack) &&
				isOptionalFiniteNumber(msg.line) &&
				isOptionalFiniteNumber(msg.column) &&
				isOptionalString(msg.requestId)
			);
		case 'SYNTH_ERROR':
			return typeof msg.message === 'string' && isOptionalString(msg.uniformName);
		case 'PONG':
			return isOptionalString(msg.nonce) && isFiniteNumber(msg.timestamp);
		default:
			return false;
	}
}

/**
 * Checks whether a value is a valid current host-to-runner MessagePort message.
 *
 * @category Guards
 */
export function isParentMessage(msg: unknown): msg is ParentToRunnerMessage {
	if (!isMessageRecord(msg)) return false;

	switch (msg.type) {
		case 'RUN_CODE':
			return typeof msg.code === 'string' && isOptionalString(msg.requestId);
		case 'DISPOSE':
			return true;
		case 'PING':
			return isOptionalString(msg.nonce);
		case 'AUDIO_DATA':
			return (
				isBoundedUint8Array(msg.fft, MAX_AUDIO_FFT_BINS) &&
				isBoundedUint8Array(msg.waveform, MAX_AUDIO_WAVEFORM_SAMPLES) &&
				isFiniteNumber(msg.timestamp)
			);
		default:
			return false;
	}
}

/**
 * Checks whether a value is a valid current runner iframe initialization message.
 *
 * @category Guards
 */
export function isInitMessage(msg: unknown): msg is InitMessage {
	return isMessageRecord(msg) && msg.type === 'INIT' && Object.keys(msg).length === 1;
}

/**
 * Checks whether a value is a valid current runner capability set.
 *
 * @category Guards
 */
export function isRunnerCapabilities(value: unknown): value is RunnerCapabilities {
	if (!isMessageRecord(value)) return false;
	if ('protocolVersions' in value) return false;
	if ('clients' in value) return false;

	return (
		typeof value.heartbeat === 'boolean' &&
		!('runtimeConfig' in value) &&
		!('exports' in value) &&
		!('fonts' in value) &&
		!('playback' in value)
	);
}
