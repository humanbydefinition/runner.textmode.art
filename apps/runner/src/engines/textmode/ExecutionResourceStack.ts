export interface ExecutionDisposable {
	dispose(): void;
}

type Cleanup = () => void;

/** Owns resources and cleanup callbacks created by one submitted sketch execution. */
export class ExecutionResourceStack {
	private readonly cleanups: Cleanup[] = [];
	private readonly resources = new Set<ExecutionDisposable>();
	private disposed = false;

	defer(cleanup: Cleanup): void {
		if (this.disposed) {
			this.run(cleanup);
			return;
		}

		this.cleanups.push(cleanup);
	}

	use(value: unknown): void {
		if (!isExecutionDisposable(value) || this.resources.has(value)) return;

		this.resources.add(value);
		this.defer(() => value.dispose());
	}

	dispose(): void {
		if (this.disposed) return;
		this.disposed = true;

		for (const cleanup of this.cleanups.reverse()) this.run(cleanup);
		this.cleanups.length = 0;
		this.resources.clear();
	}

	private run(cleanup: Cleanup): void {
		try {
			cleanup();
		} catch (error) {
			console.warn('Error disposing sketch execution resource:', error);
		}
	}
}

function isExecutionDisposable(value: unknown): value is ExecutionDisposable {
	return (
		(typeof value === 'object' && value !== null) || typeof value === 'function'
	) && typeof (value as ExecutionDisposable).dispose === 'function';
}
