import { createDocumentVisibilityApi, isPageVisible, type PageVisibilityApi } from './visibility';

export interface HeartbeatTimerApi {
	setInterval: (handler: () => void, intervalMs: number) => number;
	clearInterval: (intervalId: number) => void;
}

export interface HeartbeatControllerOptions {
	intervalMs: number;
	timeoutMs: number;
	now?: () => number;
	timerApi?: HeartbeatTimerApi;
	visibilityApi?: PageVisibilityApi;
	onPing: () => void;
	onTimeout: () => void;
}

export class HeartbeatController {
	private readonly intervalMs: number;
	private readonly timeoutMs: number;
	private readonly now: () => number;
	private readonly timerApi: HeartbeatTimerApi;
	private readonly visibilityApi: PageVisibilityApi;
	private readonly onPing: () => void;
	private readonly onTimeout: () => void;
	private intervalId: number | null = null;
	private cleanupVisibility: (() => void) | null = null;
	private isActive = false;
	private lastPongAt = 0;

	constructor(options: HeartbeatControllerOptions) {
		this.intervalMs = options.intervalMs;
		this.timeoutMs = options.timeoutMs;
		this.now = options.now ?? Date.now;
		this.timerApi = options.timerApi ?? createWindowTimerApi();
		this.visibilityApi = options.visibilityApi ?? createDocumentVisibilityApi();
		this.onPing = options.onPing;
		this.onTimeout = options.onTimeout;
	}

	start(): void {
		this.stop();
		this.isActive = true;
		this.lastPongAt = this.now();
		this.cleanupVisibility = this.visibilityApi.addChangeListener(this.handleVisibilityChange);

		if (isPageVisible(this.visibilityApi)) {
			this.startInterval();
		}
	}

	stop(): void {
		this.isActive = false;
		this.stopInterval();
		this.cleanupVisibility?.();
		this.cleanupVisibility = null;
	}

	markPong(): void {
		this.lastPongAt = this.now();
	}

	private readonly handleVisibilityChange = (): void => {
		if (!this.isActive) return;

		if (!isPageVisible(this.visibilityApi)) {
			this.stopInterval();
			return;
		}

		this.lastPongAt = this.now();
		this.startInterval();
	};

	private startInterval(): void {
		if (this.intervalId !== null) return;

		this.intervalId = this.timerApi.setInterval(() => {
			if (!isPageVisible(this.visibilityApi)) {
				this.stopInterval();
				return;
			}

			if (this.now() - this.lastPongAt > this.timeoutMs) {
				this.onTimeout();
				return;
			}

			this.onPing();
		}, this.intervalMs);
	}

	private stopInterval(): void {
		if (this.intervalId !== null) {
			this.timerApi.clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}
}

function createWindowTimerApi(): HeartbeatTimerApi {
	return {
		setInterval: (handler, intervalMs) => window.setInterval(handler, intervalMs),
		clearInterval: (intervalId) => window.clearInterval(intervalId),
	};
}
