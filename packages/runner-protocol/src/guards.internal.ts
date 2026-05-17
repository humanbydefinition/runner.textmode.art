import { EXPORT_FORMATS, type ExportFormat } from './capabilities';
import type { ExportProgress } from './exports';
import type { PlaybackAction, PlaybackState } from './playback';
import type { RuntimeSettings } from './runtime';

export function isMessageRecord(value: unknown): value is Record<string, unknown> & { type?: unknown } {
	return typeof value === 'object' && value !== null;
}

export function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

export function isOptionalString(value: unknown): value is string | undefined {
	return value === undefined || typeof value === 'string';
}

export function isOptionalFiniteNumber(value: unknown): value is number | undefined {
	return value === undefined || isFiniteNumber(value);
}

export function isOptionalBlob(value: unknown): value is Blob | undefined {
	return value === undefined || (typeof Blob !== 'undefined' && value instanceof Blob);
}

export function isRuntimeSettings(value: unknown): value is RuntimeSettings {
	if (!isMessageRecord(value)) return false;

	return (
		isPositiveFiniteNumber(value.width) &&
		isPositiveFiniteNumber(value.height) &&
		isPositiveFiniteNumber(value.fontSize) &&
		isPositiveFiniteNumber(value.frameRate)
	);
}

export function isPartialRuntimeSettings(value: unknown): value is Partial<RuntimeSettings> {
	if (!isMessageRecord(value)) return false;

	return (
		(value.width === undefined || isPositiveFiniteNumber(value.width)) &&
		(value.height === undefined || isPositiveFiniteNumber(value.height)) &&
		(value.fontSize === undefined || isPositiveFiniteNumber(value.fontSize)) &&
		(value.frameRate === undefined || isPositiveFiniteNumber(value.frameRate))
	);
}

export function isExportFormat(value: unknown): value is ExportFormat {
	return EXPORT_FORMATS.includes(value as ExportFormat);
}

export function isPlaybackAction(value: unknown): value is PlaybackAction {
	return (
		value === 'play' ||
		value === 'pause' ||
		value === 'stop' ||
		value === 'seek' ||
		value === 'next' ||
		value === 'previous' ||
		value === 'setMaxFrames' ||
		value === 'state'
	);
}

export function isPlaybackState(value: unknown): value is PlaybackState {
	if (!isMessageRecord(value)) return false;

	return (
		typeof value.isPlaying === 'boolean' &&
		isFiniteNumber(value.frame) &&
		isFiniteNumber(value.maxFrames) &&
		(value.fps === undefined || isFiniteNumber(value.fps))
	);
}

export function isExportProgress(value: unknown): value is ExportProgress {
	if (!isMessageRecord(value)) return false;

	return (
		typeof value.state === 'string' &&
		isOptionalFiniteNumber(value.frameIndex) &&
		isOptionalFiniteNumber(value.totalFrames) &&
		isOptionalString(value.message)
	);
}

function isPositiveFiniteNumber(value: unknown): value is number {
	return isFiniteNumber(value) && value > 0;
}
