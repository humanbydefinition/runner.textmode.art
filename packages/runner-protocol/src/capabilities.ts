/**
 * Export families supported by the current runner.
 *
 * @category Capabilities
 */
export const EXPORT_FORMATS = ['image', 'svg', 'txt', 'gif', 'webm'] as const;

/**
 * Export format advertised by runner capabilities and export messages.
 *
 * @category Capabilities
 */
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/**
 * Feature flags advertised by a ready runner iframe.
 *
 * Capabilities describe feature availability only. They are not a runtime
 * protocol version negotiation mechanism.
 *
 * @category Capabilities
 */
export interface RunnerCapabilities {
	/** Whether fixed runtime settings can be configured before execution. */
	runtimeConfig: boolean;
	/** Export formats available through the runner. */
	exports: ExportFormat[];
	/** Whether host apps can load fonts into the runner. */
	fonts: boolean;
	/** Whether playback controls and state reporting are available. */
	playback: boolean;
	/** Whether the runner responds to heartbeat pings. */
	heartbeat: boolean;
}

/**
 * Creates the capability set for the current hosted runner implementation.
 *
 * @returns The current runner capability set.
 * @category Capabilities
 */
export function createRunnerCapabilities(): RunnerCapabilities {
	return {
		runtimeConfig: true,
		exports: [...EXPORT_FORMATS],
		fonts: true,
		playback: true,
		heartbeat: true,
	};
}
