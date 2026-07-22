/**
 * Feature flags advertised by a ready runner iframe.
 *
 * Capabilities describe the small host-facing runner contract. In-sketch
 * textmode plugin APIs are not advertised here because they are part of the
 * sandboxed runtime, not the parent iframe protocol.
 *
 * @category Capabilities
 */
export interface RunnerCapabilities {
	/** Whether the runner responds to heartbeat pings. */
	heartbeat: boolean;
	/** Whether the runner can rebuild its textmode runtime without replacing the iframe document. */
	runtimeReset?: boolean;
	/** Whether the runner can request a trusted user interaction inside its iframe. */
	userActivationPrompt?: boolean;
}

/**
 * Creates the capability set for the current hosted runner implementation.
 *
 * @returns The current runner capability set.
 * @category Capabilities
 */
export function createRunnerCapabilities(): RunnerCapabilities {
	return {
		heartbeat: true,
		runtimeReset: true,
		userActivationPrompt: true,
	};
}
