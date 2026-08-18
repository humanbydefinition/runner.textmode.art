import { describe, expect, it } from 'vitest';
import { AudioReceiver } from '../src/engines/textmode/AudioReceiver';
import { ErrorReporter } from '../src/engines/textmode/ErrorReporter';
import { ExecutionContext } from '../src/engines/textmode/ExecutionContext';

describe('ExecutionContext audio global', () => {
	it('exposes the latest audio receiver data to user code', async () => {
		const audioReceiver = new AudioReceiver();
		audioReceiver.update({
			type: 'AUDIO_DATA',
			fft: new Uint8Array([255, 0, 128, 64]),
			waveform: new Uint8Array([128, 255, 0, 128]),
			timestamp: 42,
		});

		const context = new ExecutionContext({
			getTextmode: () => null,
			runTextmodeSetup: async () => {},
			errorReporter: new ErrorReporter(() => {}),
			audioReceiver,
		});

		const result = await context.execute(`
globalThis.__audioSnapshot = {
  hasData: audio.hasData(),
  fft: Array.from(audio.fft()),
  waveform: Array.from(audio.waveform()),
  bass: audio.bass(),
  volume: audio.volume(),
  timestamp: audio.timestamp(),
};
`);

		expect(result.success).toBe(true);
		expect((globalThis as typeof globalThis & { __audioSnapshot: unknown }).__audioSnapshot).toMatchObject({
			hasData: true,
			fft: [255, 0, 128, 64],
			waveform: [128, 255, 0, 128],
			bass: 1,
			timestamp: 42,
		});
		expect(
			(globalThis as typeof globalThis & { __audioSnapshot: { volume: number } }).__audioSnapshot.volume
		).toBeCloseTo(Math.sqrt((0 + (127 / 128) ** 2 + 1 + 0) / 4));

		delete (globalThis as typeof globalThis & { __audioSnapshot?: unknown }).__audioSnapshot;
	});
});
