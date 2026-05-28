import type { IFrameScheduler, PendingExecution } from './textmode.types';

export interface FrameSchedulerOptions {
    /** Callback to check if currently rendering */
    isRendering: () => boolean;
    /** Callback to execute the code */
    onExecute: (code: string, isSoftReset: boolean, requestId?: string) => void | Promise<void>;
    /** Fallback delay for browsers that pause requestAnimationFrame. */
    fallbackDelayMs?: number;
}

/**
 * Schedules code execution at safe frame boundaries
 */
export class FrameScheduler implements IFrameScheduler {
    private pendingExecution: PendingExecution | null = null;
    private executionGeneration = 0;
    private options: FrameSchedulerOptions;
    private firstRafId: number | null = null;
    private secondRafId: number | null = null;
    private fallbackTimeoutId: number | null = null;

    constructor(options: FrameSchedulerOptions) {
        this.options = options;
    }

    /**
     * Schedule execution at the next safe frame boundary.
     * Uses double-RAF to catch the very beginning of a frame.
     */
    schedule(execution: PendingExecution): void {
        // Increment generation to invalidate any pending RAF chains
        const thisGeneration = ++this.executionGeneration;
        this.pendingExecution = execution;
        this.clearScheduledCallbacks();

        if (!this.options.isRendering()) {
            this.processPending();
            return;
        }

        this.scheduleBoundary(thisGeneration);
    }

    private scheduleBoundary(generation: number): void {
        this.clearScheduledCallbacks();

        // First RAF: wait for current frame to complete its callback phase
        this.firstRafId = requestAnimationFrame(() => {
            this.firstRafId = null;
            if (generation !== this.executionGeneration) return;

            // Second RAF: now we're at the very start of the next frame,
            // before textmode's render loop has been called
            this.secondRafId = requestAnimationFrame(() => {
                this.secondRafId = null;
                this.clearFallbackTimeout();
                if (generation !== this.executionGeneration) return;
                this.processPending();
            });
        });

        this.fallbackTimeoutId = window.setTimeout(() => {
            this.fallbackTimeoutId = null;
            this.clearAnimationFrames();
            if (generation !== this.executionGeneration) return;
            this.processPending();
        }, this.options.fallbackDelayMs ?? 100);
    }

    /**
     * Cancel any pending execution
     */
    cancel(): void {
        this.executionGeneration++;
        this.pendingExecution = null;
        this.clearScheduledCallbacks();
    }

    /**
     * Process pending execution when frame is safe
     */
    private processPending(): void {
        if (!this.pendingExecution) return;

        // Double-check we're not mid-render
        if (this.options.isRendering()) {
            // Still rendering, try again next frame
            this.scheduleBoundary(this.executionGeneration);
            return;
        }

        const { code, isSoftReset, requestId } = this.pendingExecution;
        this.pendingExecution = null;
        this.options.onExecute(code, isSoftReset, requestId);
    }

    private clearScheduledCallbacks(): void {
        this.clearAnimationFrames();
        this.clearFallbackTimeout();
    }

    private clearAnimationFrames(): void {
        if (this.firstRafId !== null) {
            cancelAnimationFrame(this.firstRafId);
            this.firstRafId = null;
        }

        if (this.secondRafId !== null) {
            cancelAnimationFrame(this.secondRafId);
            this.secondRafId = null;
        }
    }

    private clearFallbackTimeout(): void {
        if (this.fallbackTimeoutId !== null) {
            window.clearTimeout(this.fallbackTimeoutId);
            this.fallbackTimeoutId = null;
        }
    }
}
