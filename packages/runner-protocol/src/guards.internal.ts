import { RUNNER_MOUSE_EVENT_TYPES, type RunnerMouseEventPayload } from './messages';

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

export function isUint8Array(value: unknown): value is Uint8Array {
	return Object.prototype.toString.call(value) === '[object Uint8Array]';
}

export function isBoundedUint8Array(value: unknown, maxLength: number): value is Uint8Array {
	return isUint8Array(value) && value.length <= maxLength;
}

export function isOptionalBoolean(value: unknown): value is boolean | undefined {
	return value === undefined || typeof value === 'boolean';
}

const VALID_MOUSE_EVENT_TYPES = new Set<string>(RUNNER_MOUSE_EVENT_TYPES);

export function isRunnerMouseEventPayload(value: unknown): value is RunnerMouseEventPayload {
	if (!isMessageRecord(value)) return false;
	return (
		typeof value.eventType === 'string' &&
		VALID_MOUSE_EVENT_TYPES.has(value.eventType) &&
		isFiniteNumber(value.clientX) &&
		isFiniteNumber(value.clientY) &&
		isOptionalFiniteNumber(value.button) &&
		isOptionalFiniteNumber(value.buttons) &&
		isOptionalBoolean(value.altKey) &&
		isOptionalBoolean(value.ctrlKey) &&
		isOptionalBoolean(value.metaKey) &&
		isOptionalBoolean(value.shiftKey)
	);
}
