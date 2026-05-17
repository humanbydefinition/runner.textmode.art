import type { CodeError } from '@/core/types';

const USER_CODE_STACK_LINE_OFFSET = 2;

/**
 * Normalizes various error types into a standard CodeError object.
 * Extracts line/column from stack traces when available.
 */
export function normalizeError(error: unknown): CodeError {
	let message = '';
	let stack: string | undefined;
	let line: number | undefined;
	let column: number | undefined;

	if (error instanceof Error) {
		message = error.message;
		stack = error.stack;
	} else if (typeof error === 'string') {
		message = error;
	} else if (isErrorLike(error)) {
		message = String(error.message);
		stack = typeof error.stack === 'string' ? error.stack : undefined;
		line = toFiniteNumber(error.line);
		column = toFiniteNumber(error.column);
	} else {
		message = String(error);
	}

	if (line === undefined && stack) {
		const location = getUserCodeLocation(stack);
		line = location?.line;
		column = location?.column;
	}

	return { message, stack, line, column };
}

function isErrorLike(value: unknown): value is { message: unknown; stack?: unknown; line?: unknown; column?: unknown } {
	return typeof value === 'object' && value !== null && 'message' in value;
}

function toFiniteNumber(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getUserCodeLocation(stack: string): { line: number; column: number } | null {
	const stackMatch = stack.match(/<anonymous>:(\d+):(\d+)/);
	if (!stackMatch?.[1] || !stackMatch[2]) return null;

	return {
		line: Math.max(1, Number.parseInt(stackMatch[1], 10) - USER_CODE_STACK_LINE_OFFSET),
		column: Number.parseInt(stackMatch[2], 10),
	};
}
