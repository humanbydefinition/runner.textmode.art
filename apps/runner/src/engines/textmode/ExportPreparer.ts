import type { PreparedExportArtifact } from '@textmode/runner-protocol';
import type { Textmodifier } from 'textmode.js';

const MAX_EXPORT_BYTES = 10 * 1024 * 1024;

/** Generates data only; browser download remains a host-side user action. */
export class ExportPreparer {
	constructor(private readonly getTextmode: () => Textmodifier | null) {}

	async prepare(options: {
		format: PreparedExportArtifact['format'];
		target: 'selected' | 'all';
		fileName?: string;
	}): Promise<PreparedExportArtifact> {
		const instance = this.getTextmode();
		if (!instance) throw new Error('Textmode runtime is not initialized');
		const fileName = sanitizeFileName(options.fileName ?? 'textmode-artwork', options.format);
		if (options.format === 'png') {
			if (options.target !== 'selected') throw new Error('PNG supports only the selected rendered artwork');
			const blob = await instance.toImageBlob({ format: 'png' });
			const data = await blob.arrayBuffer();
			assertSize(data.byteLength);
			return { format: 'png', mimeType: 'image/png', fileName, data };
		}
		if (options.format === 'svg') {
			if (options.target !== 'selected') throw new Error('SVG supports only a selected layer');
			return this.textArtifact('svg', 'image/svg+xml', fileName, instance.toSVG());
		}
		if (options.format === 'txt') {
			if (options.target !== 'selected') throw new Error('TXT supports only a selected layer');
			return this.textArtifact('txt', 'text/plain;charset=utf-8', fileName, instance.toString());
		}
		return this.textArtifact(
			'json',
			'application/json;charset=utf-8',
			fileName,
			instance.toJSONString({ target: options.target, pretty: true })
		);
	}

	private textArtifact(
		format: Extract<PreparedExportArtifact['format'], 'svg' | 'txt' | 'json'>,
		mimeType: string,
		fileName: string,
		data: string
	): PreparedExportArtifact {
		assertSize(new TextEncoder().encode(data).byteLength);
		return { format, mimeType, fileName, data };
	}
}

function assertSize(bytes: number): void {
	if (bytes > MAX_EXPORT_BYTES) throw new Error('Export exceeds the 10 MiB limit');
}

function sanitizeFileName(value: string, format: string): string {
	const base = value
		.replace(/[^a-zA-Z0-9._-]+/g, '-')
		.replace(/^[._-]+|[._-]+$/g, '')
		.slice(0, 80);
	return `${base || 'textmode-artwork'}.${format}`;
}
