import type { ParentToRunnerMessage } from '@textmode/runner-protocol';

export type RequestKind = 'run' | 'export' | 'font' | 'playback' | 'settings';

export interface RequestTimerApi {
	setTimeout: (handler: () => void, timeoutMs: number) => number;
	clearTimeout: (timeoutId: number) => void;
}

interface PendingRequest<T> {
	kind: RequestKind;
	resolve: (value: T) => void;
	reject: (error: Error) => void;
	timeoutId: number;
}

interface RegisterRequestOptions {
	requestId: string;
	kind: RequestKind;
	messageType: ParentToRunnerMessage['type'];
	timeoutMs: number;
	onTimeout: (error: Error) => void;
}

export class RequestRegistry {
	private readonly pending = new Map<string, PendingRequest<unknown>>();
	private readonly timerApi: RequestTimerApi;

	constructor(timerApi: RequestTimerApi = createWindowTimerApi()) {
		this.timerApi = timerApi;
	}

	get size(): number {
		return this.pending.size;
	}

	register<T>(options: RegisterRequestOptions): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const timeoutId = this.timerApi.setTimeout(() => {
				this.pending.delete(options.requestId);
				const error = new Error(`runner request timed out: ${options.messageType}`);
				reject(error);
				options.onTimeout(error);
			}, options.timeoutMs);

			this.pending.set(options.requestId, {
				kind: options.kind,
				resolve: resolve as (value: unknown) => void,
				reject,
				timeoutId,
			});
		});
	}

	resolve(requestId: string | undefined, value: unknown): boolean {
		if (!requestId) return false;

		const pending = this.pending.get(requestId);
		if (!pending) return false;

		this.timerApi.clearTimeout(pending.timeoutId);
		this.pending.delete(requestId);
		pending.resolve(value);
		return true;
	}

	reject(requestId: string, error: Error): boolean {
		const pending = this.pending.get(requestId);
		if (!pending) return false;

		this.timerApi.clearTimeout(pending.timeoutId);
		this.pending.delete(requestId);
		pending.reject(error);
		return true;
	}

	rejectAll(error: Error): void {
		for (const [requestId, pending] of this.pending) {
			this.timerApi.clearTimeout(pending.timeoutId);
			pending.reject(error);
			this.pending.delete(requestId);
		}
	}
}

export function requestKindForMessage(type: ParentToRunnerMessage['type']): RequestKind {
	switch (type) {
		case 'RUN_CODE':
		case 'SOFT_RESET':
			return 'run';
		case 'EXPORT':
			return 'export';
		case 'LOAD_FONT':
		case 'GET_FONT_METADATA':
			return 'font';
		case 'PLAYBACK':
			return 'playback';
		case 'CONFIGURE_RUNTIME':
		case 'SET_SETTINGS':
		case 'PING':
		case 'DISPOSE':
			return 'settings';
	}
}

function createWindowTimerApi(): RequestTimerApi {
	return {
		setTimeout: (handler, timeoutMs) => window.setTimeout(handler, timeoutMs),
		clearTimeout: (timeoutId) => window.clearTimeout(timeoutId),
	};
}
