import type { RunErrorMessage } from '@textmode/runner-protocol';

/**
 * Error shape surfaced by runner execution callbacks and rejected run requests.
 *
 * @category Errors
 */
export interface RunnerExecutionError {
	/** Human-readable error message. */
	message: string;
	/** Optional stack trace reported by the runner. */
	stack?: string;
	/** Optional 1-based source line. */
	line?: number;
	/** Optional 1-based source column. */
	column?: number;
}

/**
 * Error used when a request-scoped runner execution fails.
 *
 * @category Errors
 */
export class RunnerRequestError extends Error implements RunnerExecutionError {
	/** Optional 1-based source line. */
	readonly line?: number;
	/** Optional 1-based source column. */
	readonly column?: number;
	/** Request identifier that produced the error. */
	readonly requestId?: string;

	constructor(message: RunErrorMessage) {
		super(message.message);
		this.name = 'RunnerRequestError';
		this.stack = message.stack;
		this.line = message.line;
		this.column = message.column;
		this.requestId = message.requestId;
	}
}
