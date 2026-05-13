import type { ExecutionResult, ValidationResult } from './textmode.types';
import { SafeProxyFactory } from './SafeProxyFactory';
import { ErrorReporter } from '@/engines/textmode/ErrorReporter';
import {
    src,
    osc,
    noise,
    gradient,
    solid,
    shape,
    char,
    voronoi,
    charColor,
    cellColor,
    paint,
    SynthPlugin,
} from 'textmode.synth.js';
import type { Textmodifier } from 'textmode.js';

/**
 * Synth exports to provide to user code
 */
const SYNTH_GLOBALS = {
    src,
    osc,
    noise,
    gradient,
    solid,
    shape,
    voronoi,
    charColor,
    cellColor,
    paint,
    char,
    SynthPlugin,
};

export interface ExecutionContextOptions {
    /** Get the textmode instance */
    getTextmode: () => Textmodifier | null;
    /** Error reporter instance */
    errorReporter: ErrorReporter;
}

/**
 * Manages a single code execution context.
 * Handles the creation of globals, execution of user code, and cleanup.
 */
export class ExecutionContext {
    private userDisposers: Array<() => void> = [];
    private drawErrorOccurred = false;
    private proxyFactory: SafeProxyFactory;
    private options: ExecutionContextOptions;

    constructor(options: ExecutionContextOptions) {
        this.options = options;
        this.proxyFactory = new SafeProxyFactory({
            onDrawError: (error) => {
                this.drawErrorOccurred = true;
                this.options.errorReporter.report(error);
            },
            hasDrawError: () => this.drawErrorOccurred,
        });
    }

    /**
     * Validate code syntax without executing
     */
    validateSyntax(code: string): ValidationResult {
        try {
            new Function(this.wrapUserCode(code));
            return { valid: true };
        } catch (error) {
            return { valid: false, error: error as Error };
        }
    }

    /**
     * Execute user code
     */
    async execute(code: string): Promise<ExecutionResult> {
        // Reset draw error state
        this.drawErrorOccurred = false;

        // Dispose previous execution
        this.dispose();

        // Get textmode and create safe proxy
        const t = this.options.getTextmode();
        const safeT = t ? this.proxyFactory.createTextmodeProxy(t) : null;

        // Prepare globals
        const globals: Record<string, unknown> = {
            t: safeT,
            onDispose: (callback: unknown) => this.registerUserDispose(callback),
            ...SYNTH_GLOBALS,
        };

        const globalKeys = Object.keys(globals);
        const globalValues = Object.values(globals);

        try {
            // Create and execute async function wrapper to support top-level await
            const fn = new Function(...globalKeys, this.wrapUserCode(code));
            const result = await fn(...globalValues);

            // Preserve the existing returned-dispose callback behavior.
            if (typeof result === 'function') {
                this.userDisposers.push(result);
            }

            return {
                success: true,
            };
        } catch (error) {
            this.dispose();
            return {
                success: false,
                error: {
                    message: (error as Error).message,
                    stack: (error as Error).stack,
                },
            };
        }
    }

    /**
     * Wrap user code in an async IIFE so sketches can use top-level await.
     */
    private wrapUserCode(code: string): string {
        return `"use strict";\nreturn (async () => {\n${code}\n})();`;
    }

    /**
     * Check if a draw error has occurred
     */
    hasDrawError(): boolean {
        return this.drawErrorOccurred;
    }

    private registerUserDispose(callback: unknown): void {
        if (typeof callback !== 'function') {
            throw new TypeError('onDispose expects a function');
        }

        this.userDisposers.push(callback as () => void);
    }

    /**
     * Dispose current execution resources
     */
    dispose(): void {
        const disposers = this.userDisposers.splice(0).reverse();

        for (const dispose of disposers) {
            try {
                dispose();
            } catch (e) {
                console.warn('Error in user dispose:', e);
            }
        }
    }
}
