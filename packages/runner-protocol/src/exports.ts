import type { ExportFormat } from './capabilities';

/**
 * Raster image export file format.
 *
 * @category Exports
 */
export type ImageExportFormat = 'png' | 'jpg' | 'webp';

/**
 * Options for raster image exports.
 *
 * @category Exports
 */
export interface ImageExportOptions {
	/** Output image format. */
	format?: ImageExportFormat;
	/** Export scale multiplier. */
	scale?: number;
	/** Encoder quality for lossy image formats. */
	quality?: number;
}

/**
 * Options for SVG exports.
 *
 * @category Exports
 */
export interface SvgExportOptions {
	/** Whether to include background rectangles in the SVG output. */
	includeBackgroundRectangles?: boolean;
	/** SVG drawing mode for text geometry. */
	drawMode?: 'fill' | 'stroke';
	/** Stroke width used when `drawMode` is `stroke`. */
	strokeWidth?: number;
}

/**
 * Options for plain text exports.
 *
 * @category Exports
 */
export interface TxtExportOptions {
	/** Whether trailing spaces should be preserved. */
	preserveTrailingSpaces?: boolean;
	/** Line ending style for generated text. */
	lineEnding?: 'lf' | 'crlf';
}

/**
 * Options for animated GIF exports.
 *
 * @category Exports
 */
export interface GifExportOptions {
	/** Suggested filename without requiring the runner to initiate a download. */
	filename?: string;
	/** Number of frames to record. */
	frameCount?: number;
	/** Capture frame rate. */
	frameRate?: number;
	/** Export scale multiplier. */
	scale?: number;
	/** GIF repeat count. */
	repeat?: number;
}

/**
 * Options for WebM exports.
 *
 * @category Exports
 */
export interface WebmExportOptions {
	/** Suggested filename without requiring the runner to initiate a download. */
	filename?: string;
	/** Number of frames to record. */
	frameCount?: number;
	/** Capture frame rate. */
	frameRate?: number;
	/** Encoder quality hint. */
	quality?: number;
	/** Whether the export should preserve transparency when supported. */
	transparent?: boolean;
}

/**
 * Typed export request payload grouped by export format.
 *
 * @category Exports
 */
export type ExportRequest =
	| { format: 'image'; options?: ImageExportOptions }
	| { format: 'svg'; options?: SvgExportOptions }
	| { format: 'txt'; options?: TxtExportOptions }
	| { format: 'gif'; options?: GifExportOptions }
	| { format: 'webm'; options?: WebmExportOptions };

/**
 * Progress payload emitted while recording multi-frame exports.
 *
 * @category Exports
 */
export interface ExportProgress {
	/** Export lifecycle state reported by the runner. */
	state: string;
	/** Zero-based frame currently being recorded, when applicable. */
	frameIndex?: number;
	/** Total frame count for the export, when known. */
	totalFrames?: number;
	/** Optional human-readable progress detail. */
	message?: string;
}

/**
 * Export format used by the protocol.
 *
 * @category Exports
 */
export type ProtocolExportFormat = ExportFormat;
