/**
 * Playback command accepted by the runner.
 *
 * @category Playback
 */
export type PlaybackAction = 'play' | 'pause' | 'stop' | 'seek' | 'next' | 'previous' | 'setMaxFrames' | 'state';

/**
 * Playback state snapshot emitted by the runner.
 *
 * @category Playback
 */
export interface PlaybackState {
	/** Whether playback is actively advancing frames. */
	isPlaying: boolean;
	/** Current frame index. */
	frame: number;
	/** Maximum frame count used by playback controls. */
	maxFrames: number;
	/** Optional measured or configured frames per second. */
	fps?: number;
}
