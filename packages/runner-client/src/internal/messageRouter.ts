import {
	isRunnerMessage,
	type PongMessage,
	type ReadyMessage,
	type RunErrorMessage,
	type RunOkMessage,
	type SynthErrorMessage,
	type ArtworkInspectionResultMessage,
	type CodeValidationResultMessage,
	type ExportPreparedMessage,
	type RequestErrorMessage,
	type RuntimeSummaryResultMessage,
} from '@textmode/runner-protocol';

export interface RunnerMessageHandlers {
	onReady: (message: ReadyMessage) => void;
	onRunOk: (message: RunOkMessage) => void;
	onRunError: (message: RunErrorMessage) => void;
	onSynthError: (message: SynthErrorMessage) => void;
	onHardReset: () => void;
	onToggleUI: () => void;
	onUserActivationRequired: () => void;
	onUserInteraction: () => void;
	onPong: (message: PongMessage) => void;
	onCodeValidationResult: (message: CodeValidationResultMessage) => void;
	onRuntimeSummaryResult: (message: RuntimeSummaryResultMessage) => void;
	onArtworkInspectionResult: (message: ArtworkInspectionResultMessage) => void;
	onExportPrepared: (message: ExportPreparedMessage) => void;
	onRequestError: (message: RequestErrorMessage) => void;
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
		case 'USER_ACTIVATION_REQUIRED':
			handlers.onUserActivationRequired();
			break;
		case 'USER_INTERACTION':
			handlers.onUserInteraction();
			break;
		case 'PONG':
			handlers.onPong(message);
			break;
		case 'CODE_VALIDATION_RESULT':
			handlers.onCodeValidationResult(message);
			break;
		case 'RUNTIME_SUMMARY_RESULT':
			handlers.onRuntimeSummaryResult(message);
			break;
		case 'ARTWORK_INSPECTION_RESULT':
			handlers.onArtworkInspectionResult(message);
			break;
		case 'EXPORT_PREPARED':
			handlers.onExportPrepared(message);
			break;
		case 'REQUEST_ERROR':
			handlers.onRequestError(message);
			break;
	}

	return true;
}
