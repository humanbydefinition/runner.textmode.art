import type { RunnerCapabilities } from './capabilities';
import type { InitMessage, ParentToRunnerMessage, RunnerToParentMessage } from './messages';
import {
	isExportFormat,
	isExportProgress,
	isFiniteNumber,
	isMessageRecord,
	isOptionalBlob,
	isOptionalFiniteNumber,
	isOptionalString,
	isPartialRuntimeSettings,
	isPlaybackAction,
	isPlaybackState,
	isRuntimeSettings,
} from './guards.internal';

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
		case 'EXPORT_RESULT':
			return (
				typeof msg.requestId === 'string' &&
				isExportFormat(msg.format) &&
				isOptionalBlob(msg.blob) &&
				isOptionalString(msg.text) &&
				isOptionalString(msg.filename) &&
				isOptionalString(msg.mimeType)
			);
		case 'EXPORT_PROGRESS':
			return (
				typeof msg.requestId === 'string' &&
				(msg.format === 'gif' || msg.format === 'webm') &&
				isExportProgress(msg.progress)
			);
		case 'FONT_LOADED':
		case 'FONT_METADATA':
			return isFontMetadataPayload(msg);
		case 'FONT_ERROR':
			return typeof msg.requestId === 'string' && typeof msg.message === 'string';
		case 'PLAYBACK_STATE':
			return isOptionalString(msg.requestId) && isPlaybackState(msg.state);
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
		case 'SOFT_RESET':
			return typeof msg.code === 'string' && isOptionalString(msg.requestId);
		case 'DISPOSE':
			return true;
		case 'CONFIGURE_RUNTIME':
			return isRuntimeSettings(msg.settings) && isOptionalString(msg.requestId);
		case 'SET_SETTINGS':
			return isPartialRuntimeSettings(msg.settings) && isOptionalString(msg.requestId);
		case 'EXPORT':
			return (
				typeof msg.requestId === 'string' &&
				isExportFormat(msg.format) &&
				(msg.options === undefined || isMessageRecord(msg.options))
			);
		case 'LOAD_FONT':
			return (
				typeof msg.requestId === 'string' &&
				typeof msg.fileName === 'string' &&
				isOptionalString(msg.mimeType) &&
				msg.buffer instanceof ArrayBuffer
			);
		case 'GET_FONT_METADATA':
			return typeof msg.requestId === 'string';
		case 'PLAYBACK':
			return (
				isOptionalString(msg.requestId) &&
				isPlaybackAction(msg.action) &&
				isOptionalFiniteNumber(msg.frame) &&
				isOptionalFiniteNumber(msg.maxFrames)
			);
		case 'PING':
			return isOptionalString(msg.nonce);
		default:
			return false;
	}
}

function isFontMetadataPayload(msg: Record<string, unknown>): boolean {
	return (
		typeof msg.requestId === 'string' &&
		(msg.familyName === null || typeof msg.familyName === 'string') &&
		Array.isArray(msg.characters) &&
		msg.characters.every((entry) => typeof entry === 'string')
	);
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
		typeof value.runtimeConfig === 'boolean' &&
		Array.isArray(value.exports) &&
		value.exports.every(isExportFormat) &&
		typeof value.fonts === 'boolean' &&
		typeof value.playback === 'boolean' &&
		typeof value.heartbeat === 'boolean'
	);
}
