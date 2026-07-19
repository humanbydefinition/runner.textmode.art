import {
	isRunnerMessage,
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
	onHardReset: () => void;
	onToggleUI: () => void;
	onUserInteraction: () => void;
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
		case 'HARD_RESET':
			handlers.onHardReset();
			break;
		case 'TOGGLE_UI':
			handlers.onToggleUI();
			break;
		case 'USER_INTERACTION':
			handlers.onUserInteraction();
			break;
		case 'PONG':
			handlers.onPong(message);
			break;
	}

	return true;
}
