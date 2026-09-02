import type { ParentToRunnerMessage } from '@textmode/runner-protocol';
import { createDocumentVisibilityApi, isPageVisible, type PageVisibilityApi } from './visibility';

export type RequestKind = 'run' | 'query' | 'export' | 'lifecycle';

export interface RequestTimerApi {
	setTimeout: (handler: () => void, timeoutMs: number) => number;
	clearTimeout: (timeoutId: number) => void;
	now: () => number;
}

interface PendingRequest<T> {
	resolve: (value: T) => void;
	reject: (error: Error) => void;
	cleanup: () => void;
}

interface RegisterRequestOptions {
	requestId: string;
	messageType: ParentToRunnerMessage['type'];
	timeoutMs: number;
	onTimeout: (error: Error) => void;
	signal?: AbortSignal;
}

export class RequestRegistry {
	private readonly pending = new Map<string, PendingRequest<unknown>>();
	private readonly timerApi: RequestTimerApi;
	private readonly visibilityApi: PageVisibilityApi;

	constructor(
		timerApi: RequestTimerApi = createWindowTimerApi(),
		visibilityApi: PageVisibilityApi = createDocumentVisibilityApi()
	) {
		this.timerApi = timerApi;
		this.visibilityApi = visibilityApi;
	}

	register<T>(options: RegisterRequestOptions): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			let remainingMs = options.timeoutMs;
			let timeoutId: number | null = null;
			let startedAt = this.timerApi.now();
			const timerApi = this.timerApi;
			let cleanupVisibility = () => {};

			function pauseTimer() {
				if (timeoutId === null) return;
				const elapsedMs = Math.max(0, timerApi.now() - startedAt);
				remainingMs = Math.max(0, remainingMs - elapsedMs);
				timerApi.clearTimeout(timeoutId);
				timeoutId = null;
			}

			const cleanup = () => {
				if (timeoutId !== null) {
					timerApi.clearTimeout(timeoutId);
					timeoutId = null;
				}
				cleanupVisibility();
				options.signal?.removeEventListener('abort', onAbort);
			};
			const onAbort = () => {
				cleanup();
				this.pending.delete(options.requestId);
				reject(new DOMException('Runner request aborted', 'AbortError'));
			};

			const rejectTimedOut = () => {
				cleanup();
				this.pending.delete(options.requestId);
				const error = new Error(`runner request timed out: ${options.messageType}`);
				reject(error);
				options.onTimeout(error);
			};

			const scheduleTimer = () => {
				startedAt = timerApi.now();
				timeoutId = timerApi.setTimeout(
					() => {
						timeoutId = null;
						if (!isPageVisible(this.visibilityApi)) {
							remainingMs = 0;
							return;
						}
						rejectTimedOut();
					},
					Math.max(0, remainingMs)
				);
			};

			function resumeTimer() {
				if (timeoutId !== null) return;
				scheduleTimer();
			}

			cleanupVisibility = this.visibilityApi.addChangeListener(() => {
				if (isPageVisible(this.visibilityApi)) {
					resumeTimer();
					return;
				}

				pauseTimer();
			});

			if (isPageVisible(this.visibilityApi)) {
				scheduleTimer();
			}

			this.pending.set(options.requestId, {
				resolve: resolve as (value: unknown) => void,
				reject,
				cleanup,
			});
			if (options.signal?.aborted) {
				onAbort();
			} else {
				options.signal?.addEventListener('abort', onAbort, { once: true });
			}
		});
	}

	resolve(requestId: string | undefined, value: unknown): boolean {
		if (!requestId) return false;

		const pending = this.pending.get(requestId);
		if (!pending) return false;

		pending.cleanup();
		this.pending.delete(requestId);
		pending.resolve(value);
		return true;
	}

	reject(requestId: string, error: Error): boolean {
		const pending = this.pending.get(requestId);
		if (!pending) return false;

		pending.cleanup();
		this.pending.delete(requestId);
		pending.reject(error);
		return true;
	}

	rejectAll(error: Error): void {
		for (const [requestId, pending] of this.pending) {
			pending.cleanup();
			pending.reject(error);
			this.pending.delete(requestId);
		}
	}
}

export function requestKindForMessage(type: ParentToRunnerMessage['type']): RequestKind {
	switch (type) {
		case 'RUN_CODE':
			return 'run';
		case 'RESET_RUNTIME':
			return 'lifecycle';
		case 'VALIDATE_CODE':
		case 'GET_RUNTIME_SUMMARY':
		case 'INSPECT_ARTWORK':
			return 'query';
		case 'PREPARE_EXPORT':
			return 'export';
		case 'PING':
		case 'DISPOSE':
		case 'AUDIO_DATA':
			return 'lifecycle';
	}
}

function createWindowTimerApi(): RequestTimerApi {
	return {
		setTimeout: (handler, timeoutMs) => window.setTimeout(handler, timeoutMs),
		clearTimeout: (timeoutId) => window.clearTimeout(timeoutId),
		now: () => Date.now(),
	};
}
