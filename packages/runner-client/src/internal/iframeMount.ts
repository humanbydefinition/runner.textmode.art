import type { IframeMountMode, IframeSandboxToken } from '../options';

export function createRunnerIframe(runnerHref: string, sandboxTokens: readonly IframeSandboxToken[]): HTMLIFrameElement {
	const iframe = document.createElement('iframe');
	iframe.id = 'textmode-sandbox-runner';
	iframe.title = 'textmode.js sandboxed runner';
	iframe.src = runnerHref;
	iframe.sandbox.add(...sandboxTokens);
	iframe.referrerPolicy = 'no-referrer';
	iframe.style.width = '100%';
	iframe.style.height = '100%';
	iframe.style.border = '0';
	iframe.style.display = 'block';
	iframe.style.background = 'transparent';
	return iframe;
}

export function mountRunnerIframe(container: HTMLElement, iframe: HTMLIFrameElement, mode: IframeMountMode): void {
	if (mode === 'append') {
		container.appendChild(iframe);
		return;
	}

	container.replaceChildren(iframe);
}

export function focusElement(element: HTMLElement): void {
	try {
		element.focus({ preventScroll: true });
	} catch {
		element.focus();
	}
}
