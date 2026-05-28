import type { PlaybackStateSnapshot } from './textmode.types';

export function shouldWrapPlaybackState(state: PlaybackStateSnapshot): boolean {
	return state.bounded === true && state.frame >= state.maxFrames - 1;
}
