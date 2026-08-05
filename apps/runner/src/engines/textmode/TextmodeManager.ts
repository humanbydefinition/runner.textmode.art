
import { textmode, Textmodifier } from 'textmode.js';
import { ExportPlugin } from 'textmode.export.js';
import { FigletPlugin } from 'textmode.figlet.js';
import { SynthPlugin, setGlobalErrorCallback } from 'textmode.synth.js';
import { FiltersPlugin } from 'textmode.filters.js';
import type { SynthLayer } from './textmode.types';

type TextmodeSettings = {
    width: number;
    height: number;
    fontSize: number;
    frameRate: number;
};

type UserSetupCallback = () => void | Promise<void>;

type InitialSetupRequest = {
    callback?: UserSetupCallback;
    resolve: () => void;
    reject: (error: unknown) => void;
};

const DEFAULT_SETTINGS: Omit<TextmodeSettings, 'width' | 'height'> = {
    fontSize: 16,
    frameRate: 60,
};

/**
 * TextmodeManager - manages the textmode.js instance lifecycle.
 * Handles initialization, resize, layer cleanup, and loop control.
 */
export class TextmodeManager {
    private instance: Textmodifier | null = null;
    private initialSetupComplete = false;
    private initialSetupRequest: InitialSetupRequest | null = null;
    private resolveInitialSetupRequest: ((request: InitialSetupRequest) => void) | null = null;
    private settings: TextmodeSettings = {
        width: window.innerWidth,
        height: window.innerHeight,
        fontSize: DEFAULT_SETTINGS.fontSize,
        frameRate: DEFAULT_SETTINGS.frameRate,
    };

    /** Callback for synth dynamic parameter errors */
    private onSynthError?: (error: Error) => void;

    /**
     * Get the textmode instance
     */
    getInstance(): Textmodifier | null {
        return this.instance;
    }

    /**
     * Initialize textmode and attach to DOM
     */
    init(): void {
        if (this.instance) return;

        this.settings = {
            ...this.settings,
            width: window.innerWidth,
            height: window.innerHeight,
        };

        const initialSetupRequest = new Promise<InitialSetupRequest>((resolve) => {
            this.resolveInitialSetupRequest = resolve;
        });

        this.instance = textmode.create({
            width: this.settings.width,
            height: this.settings.height,
            fontSize: this.settings.fontSize,
            frameRate: this.settings.frameRate,
            plugins: [ExportPlugin, SynthPlugin, FiltersPlugin, FigletPlugin],
        });

        const instance = this.instance;

        instance.exportOverlay.hide();

        void instance.setup(async () => {
            const request = await initialSetupRequest;

            if (this.instance !== instance) {
                request.reject(new Error('Textmode was disposed before setup could run'));
                return;
            }

            instance.noLoop();
            let setupError: unknown;
            let setupSucceeded = false;

            try {
                await request.callback?.();
                setupSucceeded = true;
            } catch (error) {
                setupError = error;
            } finally {
                if (this.instance === instance) {
                    this.initialSetupComplete = true;
                    this.initialSetupRequest = null;
                }
            }

            if (setupSucceeded) {
                request.resolve();
            } else {
                request.reject(setupError);
            }
        });

        document.body.appendChild(this.instance.canvas);

        // Handle resize
        window.addEventListener('resize', this.handleResize);
    }

    /**
     * Pause the animation loop
     */
    pause(): void {
        this.instance?.noLoop();
    }

    /**
     * Run the first execution inside textmode's public one-shot setup lifecycle,
     * then run later execution-scoped setup callbacks directly.
     */
    async runUserSetup(callback?: UserSetupCallback): Promise<void> {
        const instance = this.instance;
        if (!instance) {
            throw new Error('Textmode is not initialized');
        }

        if (!this.initialSetupComplete) {
            const resolveRequest = this.resolveInitialSetupRequest;
            if (!resolveRequest) {
                throw new Error('Textmode setup is already running');
            }

            this.resolveInitialSetupRequest = null;
            return new Promise<void>((resolve, reject) => {
                const request = { callback, resolve, reject };
                this.initialSetupRequest = request;
                resolveRequest(request);
            });
        }

        if (this.instance !== instance) {
            throw new Error('Textmode was disposed before setup could run');
        }

        instance.noLoop();
        await callback?.();
    }

    /**
     * Resume the animation loop
     */
    resume(): void {
        this.instance?.loop();
    }

    /**
     * Check if currently rendering a frame
     */
    isRendering(): boolean {
        return this.instance?.isRenderingFrame ?? false;
    }

    /**
     * Clean up layers before new execution
     */
    cleanupLayers(): void {
        if (!this.instance) return;

        // Reset base layer to default state to prevent property leakage between sketches
        const base = this.instance.layers.base;
        try {
            base.draw(() => { });
            base.fontSize(this.settings.fontSize);
            base.opacity(1);
            base.blendMode('normal');
            base.offset(0, 0);
            base.rotateZ(0);
            (base as unknown as { bpm?: (value: number) => void }).bpm?.(60);
            base.show();
            //base.grid?.reset();
        } catch {
            // Ignore - base layer might be in unexpected state
        }

        // Reset global instance state and rendering properties
        try {
            //this.instance.clear();
            this.instance.lineWeight(1);
            this.instance.resetShader();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (typeof (this.instance as any).bpm === 'function') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (this.instance as any).bpm(60);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (typeof (this.instance as any).seed === 'function') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (this.instance as any).seed(null);
            }
        } catch {
            // Ignore optional plugin or rendering methods
        }

        // Clear draw callbacks on all user layers
        for (const layer of this.instance.layers.all) {
            try {
                layer.draw(() => { });
            } catch {
                // Ignore - layer might be partially initialized
            }
        }

        this.clearAllSynths();

        try {
            this.instance.layers.clear();
        } catch {
            // Ignore layer clear errors during teardown
        }

    }

    /**
     * Clear synths on all layers (base + user layers)
     */
    clearAllSynths(): void {
        if (!this.instance) return;

        try {
            this.clearSynth(this.instance.layers.base);
            this.instance.layers.all.forEach((layer) => {
                this.clearSynth(layer);
            });
        } catch (e) {
            console.warn('Error clearing synths:', e);
        }
    }

    /**
     * Clear synth on a layer (added by SynthPlugin)
     */
    private clearSynth(layer: unknown): void {
        const synthLayer = layer as SynthLayer;
        if (typeof synthLayer.clearSynth === 'function') {
            synthLayer.clearSynth();
        }
    }

    /**
     * Handle window resize
     */
    private handleResize = (): void => {
        if (this.instance) {
            this.settings.width = window.innerWidth;
            this.settings.height = window.innerHeight;
            this.instance.resizeCanvas(this.settings.width, this.settings.height);
        }
    };

    /**
     * Set up a handler for synth dynamic parameter errors.
     * Uses setGlobalErrorCallback from textmode.synth.js to route errors
     * directly to the editor's error UI instead of the console.
     *
     * @param handler Callback function invoked when a synth error is detected
     */
    setupSynthErrorHandler(handler: (error: Error) => void): void {
        this.onSynthError = handler;

        // Use the library's global error callback to route errors to our handler
        // This replaces the default console.warn behavior with our editor UI
        setGlobalErrorCallback((error: unknown, uniformName: string) => {
            const errorObj =
                error instanceof Error ? error : new Error(`Synth error in "${uniformName}": ${String(error)}`);

            this.onSynthError?.(errorObj);
        });
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        window.removeEventListener('resize', this.handleResize);

        // Clear the global synth error callback
        setGlobalErrorCallback(null);

        const setupDisposedError = new Error('Textmode was disposed before setup could run');
        this.initialSetupRequest?.reject(setupDisposedError);
        this.resolveInitialSetupRequest?.({
            resolve: () => {},
            reject: () => {},
        });
        this.initialSetupRequest = null;
        this.resolveInitialSetupRequest = null;
        this.initialSetupComplete = false;

        const canvas = this.instance?.canvas ?? null;
        this.instance?.destroy();
        canvas?.remove();
        this.instance = null;
    }

}
