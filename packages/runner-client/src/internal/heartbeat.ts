export interface HeartbeatTimerApi {
	setInterval: (handler: () => void, intervalMs: number) => number;
	clearInterval: (intervalId: number) => void;
}

export interface HeartbeatControllerOptions {
	intervalMs: number;
	timeoutMs: number;
	now?: () => number;
	timerApi?: HeartbeatTimerApi;
	onPing: () => void;
	onTimeout: () => void;
}

export class HeartbeatController {
	private readonly intervalMs: number;
	private readonly timeoutMs: number;
	private readonly now: () => number;
	private readonly timerApi: HeartbeatTimerApi;
	private readonly onPing: () => void;
	private readonly onTimeout: () => void;
	private intervalId: number | null = null;
	private lastPongAt = 0;

	constructor(options: HeartbeatControllerOptions) {
		this.intervalMs = options.intervalMs;
		this.timeoutMs = options.timeoutMs;
		this.now = options.now ?? Date.now;
		this.timerApi = options.timerApi ?? createWindowTimerApi();
		this.onPing = options.onPing;
		this.onTimeout = options.onTimeout;
	}

	start(): void {
		this.stop();
		this.lastPongAt = this.now();

		this.intervalId = this.timerApi.setInterval(() => {
			if (this.now() - this.lastPongAt > this.timeoutMs) {
				this.onTimeout();
				return;
			}

			this.onPing();
		}, this.intervalMs);
	}

	stop(): void {
		if (this.intervalId !== null) {
			this.timerApi.clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	markPong(): void {
		this.lastPongAt = this.now();
	}
}

function createWindowTimerApi(): HeartbeatTimerApi {
	return {
		setInterval: (handler, intervalMs) => window.setInterval(handler, intervalMs),
		clearInterval: (intervalId) => window.clearInterval(intervalId),
	};
}
