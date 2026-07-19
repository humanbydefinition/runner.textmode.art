export type RunnerShortcut = 'hard-reset' | 'toggle-ui';

export interface RunnerShortcutEvent {
	altKey: boolean;
	ctrlKey: boolean;
	key: string;
	metaKey: boolean;
	repeat: boolean;
	shiftKey: boolean;
}

export function getRunnerShortcut(event: RunnerShortcutEvent): RunnerShortcut | null {
	if (!event.ctrlKey || !event.shiftKey || event.altKey || event.metaKey || event.repeat) return null;

	switch (event.key.toLowerCase()) {
		case 'h':
			return 'toggle-ui';
		case 'r':
			return 'hard-reset';
		default:
			return null;
	}
}
