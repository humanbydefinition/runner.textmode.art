import { describe, expect, it } from 'vitest';
import { createContext, runInContext } from 'node:vm';
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

	it('rejects retired init and capability fields', () => {
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

	it('validates the reduced ready capabilities', () => {
		const capabilities = createRunnerCapabilities();

		expect(isRunnerMessage({ type: 'READY', capabilities })).toBe(true);
		expect(capabilities).toEqual({
			heartbeat: true,
			runtimeReset: true,
		});
		expect(isRunnerCapabilities({ heartbeat: true })).toBe(true);
	});

	it('rejects removed editor capabilities', () => {
		expect(
			isRunnerCapabilities({
				heartbeat: true,
				runtimeConfig: true,
			})
		).toBe(false);
		expect(
			isRunnerCapabilities({
				heartbeat: true,
				exports: ['svg'],
			})
		).toBe(false);
		expect(
			isRunnerCapabilities({
				heartbeat: true,
				fonts: true,
			})
		).toBe(false);
		expect(
			isRunnerCapabilities({
				heartbeat: true,
				playback: true,
			})
		).toBe(false);
	});

	it('validates current parent messages', () => {
		expect(isParentMessage({ type: 'RUN_CODE', requestId: 'run_1', code: 't.draw(() => {})' })).toBe(true);
		expect(
			isParentMessage({ type: 'RESET_RUNTIME', requestId: 'reset_1', code: 't.draw(() => {})' })
		).toBe(true);
		expect(isParentMessage({ type: 'DISPOSE' })).toBe(true);
		expect(isParentMessage({ type: 'PING', nonce: 'heartbeat_1' })).toBe(true);
		expect(
			isParentMessage({
				type: 'AUDIO_DATA',
				fft: new Uint8Array([0, 127, 255]),
				waveform: new Uint8Array([128, 129, 127]),
				timestamp: Date.now(),
			})
		).toBe(true);
	});

	it('accepts audio typed arrays from another JavaScript realm', () => {
		const context = createContext({});
		const fft = runInContext('new Uint8Array([0, 127, 255])', context) as Uint8Array;
		const waveform = runInContext('new Uint8Array([128, 129, 127])', context) as Uint8Array;

		expect(fft instanceof Uint8Array).toBe(false);
		expect(
			isParentMessage({
				type: 'AUDIO_DATA',
				fft,
				waveform,
				timestamp: 1,
			})
		).toBe(true);
	});

	it('rejects removed editor parent messages', () => {
		expect(
			isParentMessage({
				type: 'CONFIGURE_RUNTIME',
				requestId: 'settings_1',
				settings: { width: 640, height: 640, fontSize: 16, frameRate: 60 },
			})
		).toBe(false);
		expect(isParentMessage({ type: 'SET_SETTINGS', requestId: 'settings_2', settings: { frameRate: 30 } })).toBe(
			false
		);
		expect(isParentMessage({ type: 'EXPORT', requestId: 'export_1', format: 'svg', options: {} })).toBe(false);
		expect(
			isParentMessage({
				type: 'LOAD_FONT',
				requestId: 'font_1',
				fileName: 'Example.woff',
				mimeType: 'font/woff',
				buffer: new ArrayBuffer(8),
			})
		).toBe(false);
		expect(isParentMessage({ type: 'GET_FONT_METADATA', requestId: 'font_metadata_1' })).toBe(false);
		expect(isParentMessage({ type: 'PLAYBACK', requestId: 'playback_1', action: 'seek', frame: 12 })).toBe(false);
	});

	it('rejects malformed parent payloads', () => {
		expect(isParentMessage({ type: 'RUN_CODE' })).toBe(false);
		expect(isParentMessage({ type: 'RESET_RUNTIME' })).toBe(false);
		expect(isParentMessage({ type: 'RESET_RUNTIME', requestId: 'reset_1', code: 42 })).toBe(false);
		expect(isParentMessage({ type: 'PING', nonce: 123 })).toBe(false);
		expect(isParentMessage({ type: 'AUDIO_DATA', fft: [1, 2], waveform: new Uint8Array([128]), timestamp: 1 })).toBe(
			false
		);
		expect(isParentMessage({ type: 'AUDIO_DATA', fft: new Uint8Array([1]), timestamp: 1 })).toBe(false);
		expect(
			isParentMessage({
				type: 'AUDIO_DATA',
				fft: new Uint8Array([1]),
				waveform: new Uint8Array([128]),
				timestamp: Number.NaN,
			})
		).toBe(false);
		expect(
			isParentMessage({
				type: 'AUDIO_DATA',
				fft: new Uint8Array(4097),
				waveform: new Uint8Array([128]),
				timestamp: 1,
			})
		).toBe(false);
		expect(
			isParentMessage({
				type: 'AUDIO_DATA',
				fft: new Uint8Array([1]),
				waveform: new Uint8Array(8193),
				timestamp: 1,
			})
		).toBe(false);
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
		expect(isRunnerMessage({ type: 'HARD_RESET' })).toBe(true);
		expect(isRunnerMessage({ type: 'TOGGLE_UI' })).toBe(true);
		expect(isRunnerMessage({ type: 'USER_INTERACTION' })).toBe(true);
		expect(isRunnerMessage({ type: 'PONG', nonce: 'heartbeat_1', timestamp: Date.now() })).toBe(true);
	});

	it('rejects removed editor runner responses', () => {
		expect(isRunnerMessage({ type: 'EXPORT_RESULT', requestId: 'export_1', format: 'svg' })).toBe(false);
		expect(
			isRunnerMessage({
				type: 'EXPORT_PROGRESS',
				requestId: 'export_1',
				format: 'gif',
				progress: { state: 'recording' },
			})
		).toBe(false);
		expect(
			isRunnerMessage({
				type: 'FONT_LOADED',
				requestId: 'font_1',
				familyName: 'Example',
				characters: ['A'],
			})
		).toBe(false);
		expect(
			isRunnerMessage({
				type: 'FONT_METADATA',
				requestId: 'font_metadata_1',
				familyName: 'UrsaFont',
				characters: ['A', 'B'],
			})
		).toBe(false);
		expect(isRunnerMessage({ type: 'FONT_ERROR', requestId: 'font_2', message: 'bad font' })).toBe(false);
		expect(
			isRunnerMessage({
				type: 'PLAYBACK_STATE',
				requestId: 'playback_1',
				state: { isPlaying: false, frame: 0, maxFrames: 200 },
			})
		).toBe(false);
	});

	it('rejects malformed runner payloads', () => {
		expect(isRunnerMessage({ type: 'RUN_OK', timestamp: 'now' })).toBe(false);
		expect(isRunnerMessage({ type: 'RUN_ERROR', message: 'bad', line: '2' })).toBe(false);
		expect(isRunnerMessage({ type: 'PONG', timestamp: 'now' })).toBe(false);
	});
});
