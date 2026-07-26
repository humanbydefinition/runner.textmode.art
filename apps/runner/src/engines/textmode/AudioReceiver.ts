import type { AudioDataMessage } from '@textmode/runner-protocol';

const DEFAULT_FFT_BIN_COUNT = 512;
const DEFAULT_WAVEFORM_LENGTH = 1024;

/**
 * Stores the latest host-provided audio analysis frame for sketch globals.
 */
export class AudioReceiver {
	private fftData = new Uint8Array(DEFAULT_FFT_BIN_COUNT);
	private waveformData = createSilenceWaveform(DEFAULT_WAVEFORM_LENGTH);
	private lastTimestamp = 0;
	private bass = 0;
	private mid = 0;
	private high = 0;
	private volume = 0;

	update(message: AudioDataMessage): void {
		if (message.fft.length !== this.fftData.length) {
			this.fftData = new Uint8Array(message.fft.length);
		}
		if (message.waveform.length !== this.waveformData.length) {
			this.waveformData = new Uint8Array(message.waveform.length);
		}

		this.fftData.set(message.fft);
		this.waveformData.set(message.waveform);
		this.lastTimestamp = message.timestamp;
		this.bass = this.computeBandAverage(0, 0.1);
		this.mid = this.computeBandAverage(0.1, 0.5);
		this.high = this.computeBandAverage(0.5, 1);
		this.volume = computeVolume(this.waveformData);
	}

	getFft(): Uint8Array {
		return new Uint8Array(this.fftData);
	}

	getWaveform(): Uint8Array {
		return new Uint8Array(this.waveformData);
	}

	getBass(): number {
		return this.bass;
	}

	getMid(): number {
		return this.mid;
	}

	getHigh(): number {
		return this.high;
	}

	getVolume(): number {
		return this.volume;
	}

	getTimestamp(): number {
		return this.lastTimestamp;
	}

	hasData(): boolean {
		return this.lastTimestamp > 0;
	}

	reset(timestamp = performance.now()): void {
		this.fftData.fill(0);
		this.waveformData.fill(128);
		this.lastTimestamp = timestamp;
		this.bass = 0;
		this.mid = 0;
		this.high = 0;
		this.volume = 0;
	}

	private computeBandAverage(startRatio: number, endRatio: number): number {
		if (this.fftData.length === 0) return 0;

		const start = Math.max(0, Math.floor(this.fftData.length * startRatio));
		const end = Math.min(this.fftData.length, Math.max(start + 1, Math.floor(this.fftData.length * endRatio)));
		let sum = 0;

		for (let index = start; index < end; index++) {
			sum += this.fftData[index] ?? 0;
		}

		return sum / ((end - start) * 255);
	}
}

function createSilenceWaveform(length: number): Uint8Array {
	const waveform = new Uint8Array(length);
	waveform.fill(128);
	return waveform;
}

function computeVolume(waveform: Uint8Array): number {
	if (waveform.length === 0) return 0;

	let sumSquares = 0;
	for (const sample of waveform) {
		const centered = (sample - 128) / 128;
		sumSquares += centered * centered;
	}

	return Math.sqrt(sumSquares / waveform.length);
}
