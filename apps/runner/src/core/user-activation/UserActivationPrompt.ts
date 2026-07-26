export interface BrowserIdentity {
	userAgent: string;
	platform: string;
	maxTouchPoints: number;
	hasBeenActive: boolean;
}

export interface UserActivationEnvironment {
	document: Document;
	selfOrigin: string;
	browser: BrowserIdentity;
}

const BLINK_OR_GECKO_TOKEN = /(?:Chrome|Chromium|Edg|OPR|SamsungBrowser|Firefox)\//;
const IOS_DEVICE = /(?:iPad|iPhone|iPod)/;

export function isLikelyWebKit(browser: BrowserIdentity): boolean {
	if (!/AppleWebKit\//.test(browser.userAgent)) return false;

	const isIOS = IOS_DEVICE.test(browser.userAgent) || (browser.platform === 'MacIntel' && browser.maxTouchPoints > 1);
	if (isIOS) return true;

	return !BLINK_OR_GECKO_TOKEN.test(browser.userAgent);
}

export function shouldRequestUserActivation(
	parentOrigin: string,
	{ selfOrigin, browser }: UserActivationEnvironment
): boolean {
	return parentOrigin !== selfOrigin && !browser.hasBeenActive && isLikelyWebKit(browser);
}

export class UserActivationPrompt {
	private button: HTMLButtonElement | null = null;

	constructor(private readonly getEnvironment: () => UserActivationEnvironment = getBrowserEnvironment) {}

	get isVisible(): boolean {
		return this.button !== null;
	}

	show(parentOrigin: string): boolean {
		if (this.button) return true;

		const environment = this.getEnvironment();
		if (!shouldRequestUserActivation(parentOrigin, environment)) return false;

		const button = environment.document.createElement('button');
		button.type = 'button';
		button.className = 'runner-activation-prompt';

		const title = environment.document.createElement('span');
		title.className = 'runner-activation-prompt__title';
		title.textContent = 'enable full frame rate';

		const detail = environment.document.createElement('span');
		detail.className = 'runner-activation-prompt__detail';
		detail.textContent = 'tap once for smooth preview';

		button.append(title, detail);
		environment.document.body.appendChild(button);
		this.button = button;
		return true;
	}

	dismiss(): void {
		this.button?.remove();
		this.button = null;
	}

	dispose(): void {
		this.dismiss();
	}
}

function getBrowserEnvironment(): UserActivationEnvironment {
	return {
		document,
		selfOrigin: window.location.origin,
		browser: {
			userAgent: navigator.userAgent,
			platform: navigator.platform,
			maxTouchPoints: navigator.maxTouchPoints,
			hasBeenActive: navigator.userActivation?.hasBeenActive ?? false,
		},
	};
}
