import type { ExecutionResult, ValidationResult } from './textmode.types';
import { SafeProxyFactory } from './SafeProxyFactory';
import { ErrorReporter } from '@/engines/textmode/ErrorReporter';
import { normalizeError } from '@/core/errors/normalizeError';
import type { AudioReceiver } from '@/engines/textmode/AudioReceiver';
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
import { ExecutionResourceStack } from './ExecutionResourceStack';

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
    /** Run an optional setup callback through the textmode execution lifecycle. */
    runTextmodeSetup: (callback?: () => void | Promise<void>) => Promise<void>;
    /** Error reporter instance */
    errorReporter: ErrorReporter;
    /** Audio receiver for audio-reactive sketches */
    audioReceiver: AudioReceiver;
}

/**
 * Manages a single code execution context.
 * Handles the creation of globals, execution of user code, and cleanup.
 */
export class ExecutionContext {
    private resources: ExecutionResourceStack | null = null;
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
        const resources = new ExecutionResourceStack();
        this.resources = resources;

        // Get textmode and create safe proxy
        const t = this.options.getTextmode();
        let hasSetupCallback = false;
        let setupCallback: unknown;
        const safeT = t
            ? this.proxyFactory.createTextmodeProxy(t, {
                  onSetup: (callback) => {
                      hasSetupCallback = true;
                      setupCallback = callback;
                  },
                  onResource: (resource) => resources.use(resource),
              })
            : null;
        const audioReceiver = this.options.audioReceiver;
        const audio = {
            fft: () => audioReceiver.getFft(),
            waveform: () => audioReceiver.getWaveform(),
            bass: () => audioReceiver.getBass(),
            mid: () => audioReceiver.getMid(),
            high: () => audioReceiver.getHigh(),
            volume: () => audioReceiver.getVolume(),
            timestamp: () => audioReceiver.getTimestamp(),
            hasData: () => audioReceiver.hasData(),
        };

        // Prepare globals
        const globals: Record<string, unknown> = {
            t: safeT,
            audio,
            onDispose: (callback: unknown) => this.registerUserDispose(resources, callback),
            ...SYNTH_GLOBALS,
        };

        const globalKeys = Object.keys(globals);
        const globalValues = Object.values(globals);

        try {
            // Create and execute async function wrapper to support top-level await
            const fn = new Function(...globalKeys, this.wrapUserCode(code));
            await fn(...globalValues);

            if (hasSetupCallback && typeof setupCallback !== 'function') {
                throw new TypeError('t.setup expects a function');
            }

            await this.options.runTextmodeSetup(
                hasSetupCallback ? (setupCallback as () => void | Promise<void>) : undefined
            );

            return {
                success: true,
            };
        } catch (error) {
            this.dispose();
            return {
                success: false,
                error: normalizeError(error),
            };
        }
    }

    /**
     * Wrap user code in an async IIFE so sketches can use top-level await.
     */
    private wrapUserCode(code: string): string {
        return `"use strict";\nreturn (async () => {\n${code}\n})();`;
    }

    private registerUserDispose(resources: ExecutionResourceStack, callback: unknown): void {
        if (typeof callback !== 'function') {
            throw new TypeError('onDispose expects a function');
        }

        resources.defer(callback as () => void);
    }

    /**
     * Dispose current execution resources
     */
    dispose(): void {
        const resources = this.resources;
        this.resources = null;
        if (!resources) return;

        try {
            this.options.getTextmode()?.resetShader();
        } catch (error) {
            console.warn('Error resetting sketch shader during disposal:', error);
        }

        resources.dispose();
    }
}
