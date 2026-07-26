import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioReceiver } from '../src/engines/textmode/AudioReceiver';
import { TextmodeEngine } from '../src/engines/textmode/TextmodeEngine';

describe('AudioReceiver', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('copies audio frames and exposes defensive snapshots', () => {
		const receiver = new AudioReceiver();
		const fft = new Uint8Array([255, 128, 0, 64]);
		const waveform = new Uint8Array([128, 255, 0, 128]);

		receiver.update({
			type: 'AUDIO_DATA',
			fft,
			waveform,
			timestamp: 123,
		});
		fft.fill(0);
		waveform.fill(0);

		expect(Array.from(receiver.getFft())).toEqual([255, 128, 0, 64]);
		expect(Array.from(receiver.getWaveform())).toEqual([128, 255, 0, 128]);
		expect(receiver.getTimestamp()).toBe(123);
		expect(receiver.hasData()).toBe(true);

		const snapshot = receiver.getFft();
		snapshot.fill(0);
		expect(Array.from(receiver.getFft())).toEqual([255, 128, 0, 64]);
	});

	it('computes bands and waveform volume', () => {
		const receiver = new AudioReceiver();
		receiver.update({
			type: 'AUDIO_DATA',
			fft: new Uint8Array([255, 0, 128, 128, 64, 64, 32, 32, 16, 16]),
			waveform: new Uint8Array([128, 255, 0, 128]),
			timestamp: 1,
		});

		expect(receiver.getBass()).toBeCloseTo(1);
		expect(receiver.getMid()).toBeCloseTo((0 + 128 + 128 + 64) / (4 * 255));
		expect(receiver.getHigh()).toBeCloseTo((64 + 32 + 32 + 16 + 16) / (5 * 255));
		expect(receiver.getVolume()).toBeCloseTo(Math.sqrt((0 + (127 / 128) ** 2 + 1 + 0) / 4));
	});

	it('caches derived metrics when a frame is received', () => {
		const receiver = new AudioReceiver();
		receiver.update({
			type: 'AUDIO_DATA',
			fft: new Uint8Array([255, 0, 128, 128]),
			waveform: new Uint8Array([128, 255, 0, 128]),
			timestamp: 1,
		});

		const internals = receiver as unknown as { fftData: Uint8Array; waveformData: Uint8Array };
		internals.fftData.fill(0);
		internals.waveformData.fill(128);

		expect(receiver.getBass()).toBeCloseTo(1);
		expect(receiver.getVolume()).toBeCloseTo(Math.sqrt((0 + (127 / 128) ** 2 + 1 + 0) / 4));
	});

	it('resets to silence', () => {
		const receiver = new AudioReceiver();
		receiver.update({
			type: 'AUDIO_DATA',
			fft: new Uint8Array([255, 255]),
			waveform: new Uint8Array([0, 255]),
			timestamp: 1,
		});

		receiver.reset(2);

		expect(Array.from(receiver.getFft())).toEqual([0, 0]);
		expect(Array.from(receiver.getWaveform())).toEqual([128, 128]);
		expect(receiver.getVolume()).toBe(0);
		expect(receiver.getTimestamp()).toBe(2);
	});

	it('accepts audio messages without initializing the sketch runtime', () => {
		vi.stubGlobal('window', {
			innerWidth: 800,
			innerHeight: 600,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		});

		const engine = new TextmodeEngine(new Set(['*']));
		const runtimeState = engine as unknown as {
			runtimeInitialized: boolean;
			audioReceiver: AudioReceiver;
			handlePortMessage: (event: MessageEvent) => void;
		};

		runtimeState.handlePortMessage({
			data: {
				type: 'AUDIO_DATA',
				fft: new Uint8Array([8]),
				waveform: new Uint8Array([128]),
				timestamp: 9,
			},
		} as MessageEvent);

		expect(runtimeState.runtimeInitialized).toBe(false);
		expect(Array.from(runtimeState.audioReceiver.getFft())).toEqual([8]);
		expect(runtimeState.audioReceiver.getTimestamp()).toBe(9);
	});
});
