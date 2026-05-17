/**
 * Metadata returned after the runner successfully loads a font file.
 *
 * @category Fonts
 */
export interface FontLoadResult {
	/** Font family name detected by the runner. */
	familyName: string | null;
	/** Characters available in the loaded font. */
	characters: string[];
}
