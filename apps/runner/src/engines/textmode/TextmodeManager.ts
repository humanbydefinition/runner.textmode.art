
import { textmode, Textmodifier } from 'textmode.js';
import { createTextmodeExportPlugin } from 'textmode.export.js';
import { FigletPlugin } from 'textmode.figlet.js';
import { SynthPlugin, setGlobalErrorCallback } from 'textmode.synth.js';
import { FiltersPlugin } from 'textmode.filters.js';
import type {
    ITextmodeManager,
    PlaybackCommand,
    PlaybackStateSnapshot,
    RuntimeSettings,
    SynthLayer,
} from './textmode.types';

type TextmodifierWithExports = Textmodifier & {
    toSVG?: (options?: Record<string, unknown>) => string;
    toString?: (options?: Record<string, unknown>) => string;
    saveGIF?: (options?: Record<string, unknown>) => Promise<void>;
    saveWEBM?: (options?: Record<string, unknown>) => Promise<void>;
    _coreReady?: Promise<void>;
};

type InternalFontManager = {
    _fontFamilyName?: string;
    fontFamilyName?: string;
    _fontFace?: { family?: string | null };
    fontFace?: { family?: string | null };
    font?: Record<string, unknown>;
};

const DEFAULT_SETTINGS: RuntimeSettings = {
    width: 640,
    height: 640,
    fontSize: 16,
    frameRate: 60,
};
const FONT_METADATA_RETRY_COUNT = 8;
const FONT_METADATA_RETRY_DELAY_MS = 50;

type FontMetadata = {
    familyName: string | null;
    characters: string[];
};

/**
 * TextmodeManager - manages the textmode.js instance lifecycle.
 * Handles initialization, resize, layer cleanup, and loop control.
 */
export class TextmodeManager implements ITextmodeManager {
    private instance: Textmodifier | null = null;
    private settings: RuntimeSettings = {
        width: window.innerWidth,
        height: window.innerHeight,
        fontSize: DEFAULT_SETTINGS.fontSize,
        frameRate: DEFAULT_SETTINGS.frameRate,
    };
    private resizeToWindow = true;
    private maxFrames = 200;
    private playbackBounded = false;

    /** Callback for synth dynamic parameter errors */
    private onSynthError?: (error: Error) => void;

    /**
     * Get the textmode instance
     */
    getInstance(): Textmodifier | null {
        return this.instance;
    }

    isInitialized(): boolean {
        return this.instance !== null;
    }

    /**
     * Initialize textmode and attach to DOM
     */
    init(settings?: Partial<RuntimeSettings>): void {
        if (this.instance) return;

        this.settings = {
            ...this.settings,
            ...settings,
        };
        this.resizeToWindow = settings === undefined;

        this.instance = textmode.create({
            width: this.settings.width,
            height: this.settings.height,
            fontSize: this.settings.fontSize,
            frameRate: this.settings.frameRate,
            plugins: [createTextmodeExportPlugin({ overlay: false }), SynthPlugin, FiltersPlugin, FigletPlugin],
        });

        document.body.appendChild(this.instance.canvas);

        // Handle resize
        window.addEventListener('resize', this.handleResize);
    }

    configure(settings: RuntimeSettings): void {
        this.settings = { ...settings };
        this.resizeToWindow = false;

        if (!this.instance) {
            this.init(this.settings);
            return;
        }

        this.applySettings(settings);
    }

    updateSettings(settings: Partial<RuntimeSettings>): RuntimeSettings {
        this.settings = {
            ...this.settings,
            ...settings,
        };

        if (this.instance) {
            this.applySettings(this.settings);
        }

        return { ...this.settings };
    }

    /**
     * Pause the animation loop
     */
    pause(): void {
        this.instance?.noLoop();
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
    cleanupLayers(isSoftReset: boolean): void {
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

        // For soft reset, also reset frame count
        if (isSoftReset) {
            try {
                this.instance.frameCount = 0;
                this.instance.secs = 0;
            } catch {
                // Ignore time reset errors
            }
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
        if (this.instance && this.resizeToWindow) {
            this.instance.resizeCanvas(window.innerWidth, window.innerHeight);
        }
    };

    async exportImageBlob(options: {
        format?: 'png' | 'jpg' | 'webp';
        scale?: number;
        quality?: number;
    } = {}): Promise<{ blob: Blob; mimeType: string }> {
        if (!this.instance) {
            throw new Error('textmode is not initialized');
        }

        const canvas = this.instance.canvas;
        const format = options.format ?? 'png';
        const scale = Math.max(0.1, options.scale ?? 1);
        const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
        const exportCanvas = document.createElement('canvas');
        const context = exportCanvas.getContext('2d');

        if (!context) {
            throw new Error('Unable to create export canvas context');
        }

        exportCanvas.width = Math.max(1, Math.round(canvas.width * scale));
        exportCanvas.height = Math.max(1, Math.round(canvas.height * scale));
        context.imageSmoothingEnabled = false;
        context.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, exportCanvas.width, exportCanvas.height);

        const blob = await new Promise<Blob>((resolve, reject) => {
            exportCanvas.toBlob(
                (candidate) => {
                    if (candidate) {
                        resolve(candidate);
                    } else {
                        reject(new Error(`Failed to create ${format.toUpperCase()} export`));
                    }
                },
                mimeType,
                format === 'png' ? undefined : options.quality ?? 1
            );
        });

        return { blob, mimeType };
    }

    exportSvg(options: Record<string, unknown> = {}): string {
        const instance = this.getExportInstance();
        if (typeof instance.toSVG !== 'function') {
            throw new Error('SVG export is not available');
        }

        return instance.toSVG(options);
    }

    exportTxt(options: Record<string, unknown> = {}): string {
        const instance = this.getExportInstance();
        if (typeof instance.toString !== 'function') {
            throw new Error('TXT export is not available');
        }

        return instance.toString(options);
    }

    async exportGif(options: Record<string, unknown> = {}): Promise<void> {
        const instance = this.getExportInstance();
        if (typeof instance.saveGIF !== 'function') {
            throw new Error('GIF export is not available');
        }

        await instance.saveGIF(options);
    }

    async exportWebm(options: Record<string, unknown> = {}): Promise<void> {
        const instance = this.getExportInstance();
        if (typeof instance.saveWEBM !== 'function') {
            throw new Error('WEBM export is not available');
        }

        await instance.saveWEBM(options);
    }

    async loadFontFromBuffer(
        buffer: ArrayBuffer,
        mimeType = 'font/woff',
        fallbackName: string | null = null
    ): Promise<FontMetadata> {
        if (!this.instance) {
            throw new Error('textmode is not initialized');
        }

        const blob = new Blob([buffer], { type: mimeType });
        const url = URL.createObjectURL(blob);

        try {
            await this.instance.loadFont(url);
            return this.getFontMetadata(fallbackName);
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    async getFontMetadata(fallbackName: string | null = null): Promise<FontMetadata> {
        if (!this.instance) {
            throw new Error('textmode is not initialized');
        }

        await this.waitForCoreReady();

        for (let attempt = 0; attempt < FONT_METADATA_RETRY_COUNT; attempt += 1) {
            const metadata = this.readFontMetadata(fallbackName);
            if (metadata.characters.length > 0 || attempt === FONT_METADATA_RETRY_COUNT - 1) {
                return metadata;
            }

            await this.sleep(FONT_METADATA_RETRY_DELAY_MS * (attempt + 1));
        }

        return this.readFontMetadata(fallbackName);
    }

    applyPlaybackCommand(command: PlaybackCommand): PlaybackStateSnapshot {
        if (!this.instance) {
            return this.getPlaybackState();
        }

        switch (command.action) {
            case 'play':
                this.instance.loop();
                break;
            case 'pause':
                this.instance.noLoop();
                break;
            case 'stop':
                this.instance.noLoop();
                this.instance.frameCount = 0;
                this.redraw();
                break;
            case 'seek':
                this.setFrame(command.frame ?? 0);
                break;
            case 'next':
                this.setFrame(this.getCurrentFrame() + 1);
                break;
            case 'previous':
                this.setFrame(this.getCurrentFrame() - 1);
                break;
            case 'setMaxFrames':
                this.maxFrames = Math.max(1, Math.floor(command.maxFrames ?? this.maxFrames));
                this.playbackBounded = true;
                if (this.getCurrentFrame() >= this.maxFrames) {
                    this.setFrame(this.maxFrames - 1);
                }
                break;
            case 'state':
                break;
        }

        return this.getPlaybackState();
    }

    getPlaybackState(): PlaybackStateSnapshot {
        const instance = this.instance;
        const frame = this.getCurrentFrame();
        const fps =
            instance && typeof instance.frameRate === 'function'
                ? this.settings.frameRate
                : undefined;

        return {
            isPlaying: Boolean(instance?.isLooping?.()),
            frame: this.playbackBounded ? Math.max(0, Math.min(frame, this.maxFrames - 1)) : frame,
            maxFrames: this.maxFrames,
            bounded: this.playbackBounded,
            fps,
        };
    }

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

        const canvas = this.instance?.canvas ?? null;
        this.instance?.destroy();
        canvas?.remove();
        this.instance = null;
    }

    private applySettings(settings: RuntimeSettings): void {
        if (!this.instance) return;

        if (this.instance.canvas.width !== settings.width || this.instance.canvas.height !== settings.height) {
            this.instance.resizeCanvas(settings.width, settings.height);
        }

        this.instance.fontSize(settings.fontSize);
        this.instance.frameRate(settings.frameRate);
    }

    private getExportInstance(): TextmodifierWithExports {
        if (!this.instance) {
            throw new Error('textmode is not initialized');
        }

        return this.instance as TextmodifierWithExports;
    }

    private getCurrentFrame(): number {
        return Math.max(0, Math.floor(this.instance?.frameCount ?? 0));
    }

    private setFrame(targetFrame: number): void {
        if (!this.instance) return;

        const requestedFrame = Math.max(0, Math.floor(targetFrame));
        const boundedFrame = this.playbackBounded ? Math.min(requestedFrame, this.maxFrames - 1) : requestedFrame;
        this.instance.frameCount = Math.max(0, boundedFrame - 1);
        this.redraw();
    }

    private redraw(): void {
        const redraw = (this.instance as unknown as { redraw?: () => void } | null)?.redraw;
        if (typeof redraw === 'function') {
            redraw.call(this.instance);
        }
    }

    private readFontMetadata(fallbackName: string | null = null): FontMetadata {
        return {
            familyName: this.deriveFontFamilyName(fallbackName),
            characters: this.extractAvailableCharacters(),
        };
    }

    private async waitForCoreReady(): Promise<void> {
        const coreReady = (this.instance as TextmodifierWithExports | null)?._coreReady;
        if (coreReady && typeof coreReady.then === 'function') {
            await coreReady;
        }
    }

    private async sleep(ms: number): Promise<void> {
        await new Promise<void>((resolve) => window.setTimeout(resolve, ms));
    }

    private extractAvailableCharacters(): string[] {
        if (!this.instance) return [];

        try {
            const characters =
                (this.instance.font as unknown as { characters?: Array<{ character: string }> })?.characters ?? [];
            const uniqueCharacters = new Set<string>();

            characters.forEach((entry) => {
                if (entry && typeof entry.character === 'string') {
                    uniqueCharacters.add(entry.character);
                }
            });

            return Array.from(uniqueCharacters);
        } catch (error) {
            console.warn('Failed to extract characters from textmodifier font:', error);
            return [];
        }
    }

    private deriveFontFamilyName(fallbackName: string | null = null): string | null {
        if (!this.instance) {
            return fallbackName?.trim() ?? null;
        }

        const fontManager = (this.instance as unknown as { font?: InternalFontManager }).font;
        const directCandidates = [
            fontManager?._fontFamilyName,
            fontManager?.fontFamilyName,
            fontManager?._fontFace?.family,
            fontManager?.fontFace?.family,
        ];

        for (const candidate of directCandidates) {
            if (typeof candidate === 'string' && candidate.trim().length > 0) {
                return candidate.trim();
            }
        }

        try {
            const rawFont = fontManager?.font;
            const nameTable = (rawFont as Record<string, unknown> | undefined)?.name as
                | Record<string, unknown>
                | undefined;

            if (nameTable) {
                const candidateKeys = ['fontFamily', 'fontFullName', 'fullName', 'preferredFamily'];

                for (const key of candidateKeys) {
                    const value = nameTable[key];
                    if (typeof value === 'string' && value.trim().length > 0) {
                        return value.trim();
                    }
                    if (Array.isArray(value)) {
                        const match = value.find((item) => typeof item === 'string' && item.trim().length > 0);
                        if (typeof match === 'string' && match.trim().length > 0) {
                            return match.trim();
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Unable to derive font family name from textmodifier instance:', error);
        }

        return fallbackName?.trim() || 'UrsaFont';
    }
}
