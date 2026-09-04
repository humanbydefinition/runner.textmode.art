import type { ArtworkInspection, RuntimeSummary } from '@textmode/runner-protocol';
import type { Textmodifier } from 'textmode.js';

type DocumentLayer = {
	id: string;
	visible: boolean;
	opacity: number;
	blendMode: string;
	offsetX: number;
	offsetY: number;
	rotationZ: number;
	grid: { cols: number; rows: number; cellWidth: number; cellHeight: number };
	cells: {
		rows: Array<Array<{ x: number; y: number; character: string; foreground: unknown; background: unknown }>>;
	};
};
type ExportDocument =
	| { target: 'all'; canvas: { width: number; height: number }; layers: DocumentLayer[] }
	| {
			target: 'selected';
			canvas: { width: number; height: number };
			grid: DocumentLayer['grid'];
			layer: Pick<DocumentLayer, 'id' | 'cells'>;
	  };

const MAX_CELLS = 64;

/** Read-only, bounded access to the semantic export representation. */
export class ArtworkInspector {
	constructor(private readonly getTextmode: () => Textmodifier | null) {}

	summary(): RuntimeSummary {
		const instance = this.requireInstance();
		const layers = [
			{ id: 'base', layer: instance.layers.base },
			...instance.layers.all.map((layer, index) => ({ id: `layer-${index + 1}`, layer })),
		];
		const grid = instance.layers.base.grid;
		return {
			sampledAt: new Date().toISOString(),
			canvas: { width: instance.canvas.width, height: instance.canvas.height },
			grid: { columns: grid?.cols ?? 0, rows: grid?.rows ?? 0 },
			layers: layers.map(({ id, layer }) => ({
				id,
				visible: layer.isVisible(),
				opacity: layer.opacity() as number,
				blendMode: String(layer.blendMode()),
			})),
		};
	}

	inspect(options: {
		detail: 'summary' | 'cells';
		layerId?: string;
		region?: { x: number; y: number; width: number; height: number };
		cursor?: number;
	}): ArtworkInspection {
		const summary = this.summary();
		if (options.detail === 'summary') return summary;
		if (
			!options.region ||
			!isValidRegion(options.region) ||
			(options.cursor !== undefined && (!Number.isInteger(options.cursor) || options.cursor < 0))
		) {
			throw new Error('A region of no more than 64 cells is required');
		}

		const document = this.requireInstance().toJSON({
			target: 'all',
			includeMetadata: false,
			colorMode: 'hex',
		}) as unknown as ExportDocument;
		const layers = document.target === 'all' ? document.layers : [selectedLayer(document)];
		const layer = layers.find((candidate) => candidate.id === (options.layerId ?? 'base'));
		if (!layer) throw new Error('Requested layer does not exist');
		const { x, y, width, height } = options.region;
		if (x < 0 || y < 0 || x + width > layer.grid.cols || y + height > layer.grid.rows) {
			throw new Error('Requested region is outside the layer grid');
		}

		const records = layer.cells.rows
			.flat()
			.filter((cell) => cell.x >= x && cell.x < x + width && cell.y >= y && cell.y < y + height);
		const cursor = options.cursor ?? 0;
		const cells = records.slice(cursor, cursor + MAX_CELLS).map((cell) => ({
			x: cell.x,
			y: cell.y,
			ch: cell.character,
			fg: String(cell.foreground),
			bg: String(cell.background),
		}));
		return {
			...summary,
			region: options.region,
			cells,
			nextCursor: cursor + cells.length < records.length ? cursor + cells.length : null,
		};
	}

	private requireInstance(): Textmodifier {
		const instance = this.getTextmode();
		if (!instance) throw new Error('Textmode runtime is not initialized');
		return instance;
	}
}

function selectedLayer(document: ExportDocument): DocumentLayer {
	if (document.target === 'all') throw new Error('Expected a selected document');
	return {
		id: document.layer.id,
		visible: true,
		opacity: 1,
		blendMode: 'normal',
		offsetX: 0,
		offsetY: 0,
		rotationZ: 0,
		grid: document.grid,
		cells: document.layer.cells,
	};
}

function isValidRegion(region: { x: number; y: number; width: number; height: number }): boolean {
	return (
		Number.isInteger(region.x) &&
		Number.isInteger(region.y) &&
		Number.isInteger(region.width) &&
		Number.isInteger(region.height) &&
		region.x >= 0 &&
		region.y >= 0 &&
		region.width >= 1 &&
		region.height >= 1 &&
		region.width * region.height <= MAX_CELLS
	);
}
