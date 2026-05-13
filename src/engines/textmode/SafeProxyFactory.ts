import type { Textmodifier } from 'textmode.js';
import type { TextmodeLayerManager, TextmodeLayer } from 'textmode.js/layering';

export interface SafeProxyOptions {
    /** Called when an error occurs in a draw callback */
    onDrawError: (error: Error) => void;
    /** Whether draw errors have occurred (to skip further draw calls) */
    hasDrawError: () => boolean;
}

/**
 * Creates proxies for textmode objects that safely wrap draw callbacks.
 * Ensures runtime errors in user draw loops don't crash the entire application.
 */
export class SafeProxyFactory {
    private options: SafeProxyOptions;
    private readonly assetLoadCache = new Map<string, Promise<unknown>>();
    private static readonly MAX_ASSET_CACHE_ENTRIES = 64;

    constructor(options: SafeProxyOptions) {
        this.options = options;
    }

    /**
     * Create a proxy for the main textmode instance
     */
    createTextmodeProxy(original: Textmodifier): Textmodifier {
        return new Proxy(original, {
            get: (target, prop) => {
                const value = (target as unknown as Record<string | symbol, unknown>)[prop];

                if (prop === 'draw') {
                    return (callback: () => void) => target.draw(this.wrapDrawCallback(callback));
                }

                if (prop === 'loadImage') {
                    return (src: string) => this.wrapMediaLoad(target, value, src, 'image');
                }

                if (prop === 'loadVideo') {
                    return (src: string) => this.wrapMediaLoad(target, value, src, 'video');
                }

                if (prop === 'loadFont') {
                    return (fontSource: string | unknown, setActive?: boolean) =>
                        this.wrapTextmodeFontLoad(target, value, fontSource, setActive);
                }

                if (prop === 'layers') {
                    return this.createLayerManagerProxy(target.layers);
                }

                return value;
            },
        });
    }

    /**
     * Create a proxy for the layer manager
     */
    private createLayerManagerProxy(layers: TextmodeLayerManager): TextmodeLayerManager {
        return new Proxy(layers, {
            get: (target, prop) => {
                const value = (target as unknown as Record<string | symbol, unknown>)[prop];

                if (prop === 'base') {
                    return this.createLayerProxy(target.base);
                }

                if (prop === 'add') {
                    return (options?: Parameters<typeof target.add>[0]) => {
                        const layer = target.add(options);
                        return this.createLayerProxy(layer);
                    };
                }

                if (prop === 'all') {
                    return (target.all as TextmodeLayer[]).map((layer) => this.createLayerProxy(layer));
                }

                return value;
            },
        });
    }

    /**
     * Create a proxy for a single layer
     */
    private createLayerProxy(layer: TextmodeLayer): TextmodeLayer {
        return new Proxy(layer, {
            get: (target, prop) => {
                const value = (target as unknown as Record<string | symbol, unknown>)[prop];

                if (prop === 'draw') {
                    return (callback: () => void) => target.draw(this.wrapDrawCallback(callback));
                }

                if (prop === 'loadFont') {
                    return (fontSource: string | unknown) => this.wrapLayerFontLoad(target, value, fontSource);
                }

                if (typeof value === 'function') {
                    return value.bind(target);
                }

                return value;
            },
        });
    }

    /**
     * Wrap a draw callback to catch errors without crashing
     */
    private wrapDrawCallback(callback: () => void): () => void {
        return () => {
            if (this.options.hasDrawError()) return; // Skip if in error state
            try {
                callback();
            } catch (error) {
                this.options.onDrawError(error as Error);
            }
        };
    }

    private wrapMediaLoad(
        target: Textmodifier,
        value: unknown,
        src: string,
        type: 'image' | 'video'
    ): Promise<unknown> {
        if (typeof value !== 'function') {
            return Promise.reject(new Error('loadImage/loadVideo is not a function'));
        }

        const invoke = (url: string) => (value as (arg: string) => Promise<unknown>).call(target, url);
        const cacheKey = `${type}:${src}`;
        return this.getOrSetCachedLoad(cacheKey, () => invoke(src));
    }

    private wrapTextmodeFontLoad(
        target: Textmodifier,
        value: unknown,
        fontSource: string | unknown,
        setActive?: boolean
    ): Promise<unknown> {
        if (typeof value !== 'function') {
            return Promise.reject(new Error('loadFont is not a function'));
        }

        const invoke = (source: unknown, active?: boolean) =>
            (value as (source: unknown, setActive?: boolean) => Promise<unknown>).call(target, source, active);

        if (typeof fontSource !== 'string') {
            return invoke(fontSource, setActive);
        }

        const cacheKey = `font:${fontSource}`;
        const activeRequested = setActive !== false;
        const cachedFontPromise = this.getOrSetCachedLoad(cacheKey, () => invoke(fontSource, false));

        if (!activeRequested) {
            return cachedFontPromise;
        }

        return cachedFontPromise.then((font) => invoke(font, true));
    }

    private wrapLayerFontLoad(layer: TextmodeLayer, value: unknown, fontSource: string | unknown): Promise<unknown> {
        if (typeof value !== 'function') {
            return Promise.reject(new Error('loadFont is not a function'));
        }

        const invoke = (source: unknown) => (value as (arg: unknown) => Promise<unknown>).call(layer, source);

        if (typeof fontSource !== 'string') {
            return invoke(fontSource);
        }

        const cacheKey = `layer-font:${fontSource}`;
        const cachedFontPromise = this.getOrSetCachedLoad(cacheKey, () => invoke(fontSource));

        return cachedFontPromise.then((font) => invoke(font));
    }

    private getOrSetCachedLoad(cacheKey: string, loader: () => Promise<unknown>): Promise<unknown> {
        const cached = this.assetLoadCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const loadPromise = loader().catch((error) => {
            // Don't keep failed entries cached so future edits can retry.
            this.assetLoadCache.delete(cacheKey);
            throw error;
        });

        this.assetLoadCache.set(cacheKey, loadPromise);
        if (this.assetLoadCache.size > SafeProxyFactory.MAX_ASSET_CACHE_ENTRIES) {
            const oldestKey = this.assetLoadCache.keys().next().value;
            if (oldestKey) {
                this.assetLoadCache.delete(oldestKey);
            }
        }

        return loadPromise;
    }

}
