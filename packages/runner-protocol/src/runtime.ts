/**
 * Fixed runtime dimensions and timing used by configurable runner hosts.
 *
 * @category Runtime
 */
export interface RuntimeSettings {
	/** Canvas width in CSS pixels. */
	width: number;
	/** Canvas height in CSS pixels. */
	height: number;
	/** Textmode font size in CSS pixels. */
	fontSize: number;
	/** Target animation frame rate. */
	frameRate: number;
}
