/**
 * Textmode-specific type definitions.
 * These types provide better typing for textmode.js interactions.
 */

import type { Textmodifier } from 'textmode.js';
import type { CodeError } from '@/core/types';
import type { PlaybackAction } from '@textmode/runner-protocol';

export interface RuntimeSettings {
    width: number;
    height: number;
    fontSize: number;
    frameRate: number;
}

export interface PlaybackCommand {
    action: PlaybackAction;
    frame?: number;
    maxFrames?: number;
}

export interface PlaybackStateSnapshot {
    isPlaying: boolean;
    frame: number;
    maxFrames: number;
    bounded?: boolean;
    fps?: number;
}

export interface FontMetadataSnapshot {
    familyName: string | null;
    characters: string[];
}

/**
 * Interface for textmode instance management
 */
export interface ITextmodeManager {
    /** Get the textmode instance */
    getInstance(): Textmodifier | null;
    /** Initialize textmode */
    init(settings?: Partial<RuntimeSettings>): void;
    /** Configure textmode for a fixed-size editor runtime */
    configure(settings: RuntimeSettings): void;
    /** Update one or more settings */
    updateSettings(settings: Partial<RuntimeSettings>): RuntimeSettings;
    /** Pause the animation loop */
    pause(): void;
    /** Resume the animation loop */
    resume(): void;
    /** Clean up layers before new execution */
    cleanupLayers(isSoftReset: boolean): void;
    /** Clear synths on all layers (base + user layers) */
    clearAllSynths(): void;
    /** Set up a handler for synth dynamic parameter errors */
    setupSynthErrorHandler(handler: (error: Error) => void): void;
    /** Current playback state */
    getPlaybackState(): PlaybackStateSnapshot;
    /** Apply playback command */
    applyPlaybackCommand(command: PlaybackCommand): PlaybackStateSnapshot;
    /** Current active font metadata */
    getFontMetadata(fallbackName?: string | null): Promise<FontMetadataSnapshot>;
}

/**
 * Synth clear method that textmode layers have
 * This is added by the SynthPlugin
 */
export interface SynthLayer {
    clearSynth(): void;
}

export interface ExecutionResult {
	success: boolean;
	error?: CodeError;
}

export interface ValidationResult {
	valid: boolean;
	error?: Error;
}

export interface PendingExecution {
	code: string;
	isSoftReset: boolean;
	requestId?: string;
}

export interface IErrorReporter {
	report(error: Error | string | Event | CodeError, requestId?: string): void;
}

export interface IFrameScheduler {
	schedule(execution: PendingExecution): void;
	cancel(): void;
}
