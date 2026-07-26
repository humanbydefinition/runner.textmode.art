/**
 * Textmode-specific type definitions.
 * These types provide better typing for textmode.js interactions.
 */

import type { CodeError } from '@/core/types';

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
	mode: 'run' | 'reset-runtime';
	requestId?: string;
}
