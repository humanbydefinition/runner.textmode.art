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
const MAX_CODE_CHARS = 64_000;
const MAX_FILE_NAME_CHARS = 80;
const MAX_LAYER_ID_CHARS = 120;
const MAX_INSPECTION_CELLS = 64;

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
		case 'USER_ACTIVATION_REQUIRED':
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
		case 'CODE_VALIDATION_RESULT':
			return typeof msg.requestId === 'string' && typeof msg.valid === 'boolean';
		case 'RUNTIME_SUMMARY_RESULT':
			return typeof msg.requestId === 'string' && isMessageRecord(msg.summary);
		case 'ARTWORK_INSPECTION_RESULT':
			return typeof msg.requestId === 'string' && isMessageRecord(msg.inspection);
		case 'EXPORT_PREPARED':
			return typeof msg.requestId === 'string' && isMessageRecord(msg.artifact);
		case 'REQUEST_ERROR':
			return (
				typeof msg.requestId === 'string' &&
				typeof msg.operation === 'string' &&
				typeof msg.code === 'string' &&
				typeof msg.message === 'string'
			);
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
		case 'RESET_RUNTIME':
			return typeof msg.code === 'string' && typeof msg.requestId === 'string';
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
		case 'VALIDATE_CODE':
			return (
				hasOnlyKeys(msg, ['type', 'requestId', 'code']) &&
				typeof msg.requestId === 'string' &&
				typeof msg.code === 'string' &&
				msg.code.length <= MAX_CODE_CHARS
			);
		case 'GET_RUNTIME_SUMMARY':
			return hasOnlyKeys(msg, ['type', 'requestId']) && typeof msg.requestId === 'string';
		case 'INSPECT_ARTWORK':
			return (
				hasOnlyKeys(msg, ['type', 'requestId', 'detail', 'layerId', 'region', 'cursor']) &&
				typeof msg.requestId === 'string' &&
				(msg.detail === 'summary' || msg.detail === 'cells') &&
				isBoundedOptionalString(msg.layerId, MAX_LAYER_ID_CHARS) &&
				isOptionalFiniteNumber(msg.cursor) &&
				(msg.cursor === undefined || Number.isInteger(msg.cursor)) &&
				(msg.cursor === undefined || (msg.cursor >= 0 && msg.cursor <= MAX_INSPECTION_CELLS)) &&
				isOptionalRegion(msg.region)
			);
		case 'PREPARE_EXPORT':
			return (
				hasOnlyKeys(msg, ['type', 'requestId', 'format', 'target', 'fileName']) &&
				typeof msg.requestId === 'string' &&
				(msg.format === 'png' || msg.format === 'svg' || msg.format === 'txt' || msg.format === 'json') &&
				(msg.target === 'selected' || msg.target === 'all') &&
				isOptionalString(msg.fileName) &&
				(msg.fileName === undefined || msg.fileName.length <= MAX_FILE_NAME_CHARS)
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
		(value.runtimeReset === undefined || typeof value.runtimeReset === 'boolean') &&
		(value.userActivationPrompt === undefined || typeof value.userActivationPrompt === 'boolean') &&
		(value.codeValidation === undefined || typeof value.codeValidation === 'boolean') &&
		(value.runtimeSummary === undefined || typeof value.runtimeSummary === 'boolean') &&
		(value.artworkInspection === undefined || typeof value.artworkInspection === 'boolean') &&
		(value.exportPreparation === undefined || typeof value.exportPreparation === 'boolean') &&
		!('runtimeConfig' in value) &&
		!('exports' in value) &&
		!('fonts' in value) &&
		!('playback' in value)
	);
}

function isOptionalRegion(value: unknown): boolean {
	if (value === undefined) return true;
	if (!isMessageRecord(value)) return false;
	if (!hasOnlyKeys(value, ['x', 'y', 'width', 'height'])) return false;
	const { x, y, width, height } = value;
	return (
		isFiniteNumber(x) &&
		isFiniteNumber(y) &&
		isFiniteNumber(width) &&
		isFiniteNumber(height) &&
		Number.isInteger(x) &&
		Number.isInteger(y) &&
		Number.isInteger(width) &&
		Number.isInteger(height) &&
		x >= 0 &&
		y >= 0 &&
		width >= 1 &&
		height >= 1 &&
		width <= MAX_INSPECTION_CELLS &&
		height <= MAX_INSPECTION_CELLS &&
		width * height <= MAX_INSPECTION_CELLS
	);
}

function isBoundedOptionalString(value: unknown, maxLength: number): boolean {
	return value === undefined || (typeof value === 'string' && value.length <= maxLength);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: string[]): boolean {
	return Object.keys(value).every((key) => allowed.includes(key));
}
