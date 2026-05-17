import { describe, expect, it } from 'vitest';
import {
	createRunnerCapabilities,
	isInitMessage,
	isParentMessage,
	isRunnerCapabilities,
	isRunnerMessage,
} from '../src/index';

describe('@textmode/runner-protocol', () => {
	it('accepts the current generic init shape', () => {
		expect(isInitMessage({ type: 'INIT' })).toBe(true);
	});

	it('rejects retired runtime protocol version fields', () => {
		expect(isInitMessage({ type: 'INIT', v: 1 })).toBe(false);
		expect(isInitMessage({ type: 'INIT', client: 'editor' })).toBe(false);
		expect(isInitMessage({ type: 'INIT', client: 'synth' })).toBe(false);
		expect(
			isRunnerMessage({
				type: 'READY',
				v: 2,
				capabilities: createRunnerCapabilities(),
			})
		).toBe(false);
		expect(
			isRunnerCapabilities({
				...createRunnerCapabilities(),
				protocolVersions: [1, 2],
			})
		).toBe(false);
		expect(
			isRunnerCapabilities({
				...createRunnerCapabilities(),
				clients: ['editor', 'synth'],
			})
		).toBe(false);
	});

	it('validates the current ready capabilities', () => {
		const capabilities = createRunnerCapabilities();

		expect(isRunnerMessage({ type: 'READY', capabilities })).toBe(true);
		expect(capabilities).toMatchObject({
			runtimeConfig: true,
			exports: ['image', 'svg', 'txt', 'gif', 'webm'],
			fonts: true,
			playback: true,
			heartbeat: true,
		});
	});

	it('validates current parent messages', () => {
		expect(isParentMessage({ type: 'RUN_CODE', requestId: 'run_1', code: 't.draw(() => {})' })).toBe(true);
		expect(isParentMessage({ type: 'SOFT_RESET', requestId: 'run_2', code: 't.draw(() => {})' })).toBe(true);
		expect(isParentMessage({ type: 'DISPOSE' })).toBe(true);
		expect(
			isParentMessage({
				type: 'CONFIGURE_RUNTIME',
				requestId: 'settings_1',
				settings: { width: 640, height: 640, fontSize: 16, frameRate: 60 },
			})
		).toBe(true);
		expect(isParentMessage({ type: 'SET_SETTINGS', requestId: 'settings_2', settings: { frameRate: 30 } })).toBe(
			true
		);
		expect(isParentMessage({ type: 'EXPORT', requestId: 'export_1', format: 'svg', options: {} })).toBe(true);
		expect(
			isParentMessage({
				type: 'LOAD_FONT',
				requestId: 'font_1',
				fileName: 'Example.woff',
				mimeType: 'font/woff',
				buffer: new ArrayBuffer(8),
			})
		).toBe(true);
		expect(isParentMessage({ type: 'PLAYBACK', requestId: 'playback_1', action: 'seek', frame: 12 })).toBe(true);
		expect(isParentMessage({ type: 'PING', nonce: 'heartbeat_1' })).toBe(true);
	});

	it('rejects malformed parent payloads', () => {
		expect(isParentMessage({ type: 'RUN_CODE' })).toBe(false);
		expect(
			isParentMessage({
				type: 'CONFIGURE_RUNTIME',
				requestId: 'settings_1',
				settings: { width: 0, height: 640, fontSize: 16, frameRate: 60 },
			})
		).toBe(false);
		expect(isParentMessage({ type: 'EXPORT', requestId: 'export_1', format: 'pdf' })).toBe(false);
		expect(isParentMessage({ type: 'LOAD_FONT', requestId: 'font_1', fileName: 'Example.woff', buffer: {} })).toBe(
			false
		);
	});

	it('validates current runner responses', () => {
		expect(isRunnerMessage({ type: 'RUN_OK', requestId: 'run_1', timestamp: Date.now() })).toBe(true);
		expect(
			isRunnerMessage({
				type: 'RUN_ERROR',
				requestId: 'run_2',
				message: 'SyntaxError',
				stack: 'stack',
				line: 2,
				column: 4,
			})
		).toBe(true);
		expect(isRunnerMessage({ type: 'SYNTH_ERROR', message: 'bad uniform', uniformName: 'uTime' })).toBe(true);
		expect(isRunnerMessage({ type: 'TOGGLE_UI' })).toBe(true);
		expect(isRunnerMessage({ type: 'USER_INTERACTION' })).toBe(true);
		expect(
			isRunnerMessage({
				type: 'EXPORT_RESULT',
				requestId: 'export_1',
				format: 'svg',
				text: '<svg />',
				filename: 'sketch.svg',
				mimeType: 'image/svg+xml',
			})
		).toBe(true);
		expect(
			isRunnerMessage({
				type: 'PLAYBACK_STATE',
				requestId: 'playback_1',
				state: { isPlaying: false, frame: 0, maxFrames: 200 },
			})
		).toBe(true);
		expect(isRunnerMessage({ type: 'PONG', nonce: 'heartbeat_1', timestamp: Date.now() })).toBe(true);
		expect(
			isRunnerMessage({
				type: 'EXPORT_PROGRESS',
				requestId: 'export_1',
				format: 'gif',
				progress: { state: 'recording', frameIndex: 1, totalFrames: 2 },
			})
		).toBe(true);
		expect(
			isRunnerMessage({
				type: 'FONT_LOADED',
				requestId: 'font_1',
				familyName: 'Example',
				characters: ['A'],
			})
		).toBe(true);
		expect(isRunnerMessage({ type: 'FONT_ERROR', requestId: 'font_2', message: 'bad font' })).toBe(true);
	});

	it('rejects malformed runner payloads', () => {
		expect(isRunnerMessage({ type: 'RUN_OK', timestamp: 'now' })).toBe(false);
		expect(isRunnerMessage({ type: 'RUN_ERROR', message: 'bad', line: '2' })).toBe(false);
		expect(isRunnerMessage({ type: 'EXPORT_RESULT', requestId: 'export_1', format: 'pdf' })).toBe(false);
		expect(
			isRunnerMessage({
				type: 'EXPORT_PROGRESS',
				requestId: 'export_1',
				format: 'svg',
				progress: { state: 'recording' },
			})
		).toBe(false);
		expect(
			isRunnerMessage({
				type: 'FONT_LOADED',
				requestId: 'font_1',
				familyName: 'Example',
				characters: [65],
			})
		).toBe(false);
		expect(isRunnerMessage({ type: 'PLAYBACK_STATE', state: { isPlaying: false, frame: 0 } })).toBe(false);
	});
});
