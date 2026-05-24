import {
	isRunnerMessage,
	type ExportProgressMessage,
	type ExportResultMessage,
	type FontErrorMessage,
	type FontLoadedMessage,
	type FontMetadataMessage,
	type PlaybackStateMessage,
	type PongMessage,
	type ReadyMessage,
	type RunErrorMessage,
	type RunOkMessage,
	type SynthErrorMessage,
} from '@textmode/runner-protocol';

export interface RunnerMessageHandlers {
	onReady: (message: ReadyMessage) => void;
	onRunOk: (message: RunOkMessage) => void;
	onRunError: (message: RunErrorMessage) => void;
	onSynthError: (message: SynthErrorMessage) => void;
	onToggleUI: () => void;
	onUserInteraction: () => void;
	onExportProgress: (message: ExportProgressMessage) => void;
	onExportResult: (message: ExportResultMessage) => void;
	onFontLoaded: (message: FontLoadedMessage) => void;
	onFontMetadata: (message: FontMetadataMessage) => void;
	onFontError: (message: FontErrorMessage) => void;
	onPlaybackState: (message: PlaybackStateMessage) => void;
	onPong: (message: PongMessage) => void;
}

export function routeRunnerMessage(message: unknown, handlers: RunnerMessageHandlers): boolean {
	if (!isRunnerMessage(message)) {
		return false;
	}

	switch (message.type) {
		case 'READY':
			handlers.onReady(message);
			break;
		case 'RUN_OK':
			handlers.onRunOk(message);
			break;
		case 'RUN_ERROR':
			handlers.onRunError(message);
			break;
		case 'SYNTH_ERROR':
			handlers.onSynthError(message);
			break;
		case 'TOGGLE_UI':
			handlers.onToggleUI();
			break;
		case 'USER_INTERACTION':
			handlers.onUserInteraction();
			break;
		case 'EXPORT_PROGRESS':
			handlers.onExportProgress(message);
			break;
		case 'EXPORT_RESULT':
			handlers.onExportResult(message);
			break;
		case 'FONT_LOADED':
			handlers.onFontLoaded(message);
			break;
		case 'FONT_METADATA':
			handlers.onFontMetadata(message);
			break;
		case 'FONT_ERROR':
			handlers.onFontError(message);
			break;
		case 'PLAYBACK_STATE':
			handlers.onPlaybackState(message);
			break;
		case 'PONG':
			handlers.onPong(message);
			break;
	}

	return true;
}
