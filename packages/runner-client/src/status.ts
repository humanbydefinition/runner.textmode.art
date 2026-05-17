/**
 * Lifecycle state for an iframe runner connection.
 *
 * @category Runtime
 */
export type RunnerRuntimeStatus =
	| 'idle'
	| 'connecting'
	| 'configuring'
	| 'ready'
	| 'recovering'
	| 'unavailable'
	| 'hung';
