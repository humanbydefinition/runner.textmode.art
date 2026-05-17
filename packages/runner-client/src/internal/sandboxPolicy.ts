import type { IframeSandboxToken } from '../options';

export interface SandboxOriginPolicyOptions {
	sandboxTokens: readonly IframeSandboxToken[];
	runnerOrigin: string;
	parentOrigin: string;
}

export function assertSandboxOriginPolicy(options: SandboxOriginPolicyOptions): void {
	const canRunSameOriginScripts =
		options.sandboxTokens.includes('allow-scripts') && options.sandboxTokens.includes('allow-same-origin');

	if (canRunSameOriginScripts && options.runnerOrigin === options.parentOrigin) {
		throw new Error('Refusing to start sandbox runner with allow-scripts and allow-same-origin on the parent origin');
	}
}
