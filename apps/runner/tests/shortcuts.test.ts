import { describe, expect, it } from 'vitest';
import { getRunnerShortcut, type RunnerShortcutEvent } from '../src/engines/textmode/shortcuts';

const BASE_EVENT: RunnerShortcutEvent = {
	altKey: false,
	ctrlKey: false,
	key: '',
	metaKey: false,
	repeat: false,
	shiftKey: false,
};

describe('runner shortcuts', () => {
	it('forwards hard reset and UI toggle shortcuts from the iframe', () => {
		expect(getRunnerShortcut({ ...BASE_EVENT, ctrlKey: true, shiftKey: true, key: 'R' })).toBe('hard-reset');
		expect(getRunnerShortcut({ ...BASE_EVENT, ctrlKey: true, shiftKey: true, key: 'h' })).toBe('toggle-ui');
	});

	it('rejects modified, incomplete, and repeated shortcuts', () => {
		expect(getRunnerShortcut({ ...BASE_EVENT, metaKey: true, shiftKey: true, key: 'R' })).toBeNull();
		expect(getRunnerShortcut({ ...BASE_EVENT, ctrlKey: true, key: 'R' })).toBeNull();
		expect(getRunnerShortcut({ ...BASE_EVENT, ctrlKey: true, shiftKey: true, key: 'R', repeat: true })).toBeNull();
	});
});
