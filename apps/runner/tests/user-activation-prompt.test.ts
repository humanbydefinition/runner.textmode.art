import { describe, expect, it, vi } from 'vitest';
import {
	isLikelyWebKit,
	shouldRequestUserActivation,
	UserActivationPrompt,
	type BrowserIdentity,
	type UserActivationEnvironment,
} from '../src/core/user-activation/UserActivationPrompt';

const SAFARI_MAC =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15';
const CHROME_MAC =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';
const FIREFOX_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:139.0) Gecko/20100101 Firefox/139.0';
const SAFARI_IOS =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1';
const CHROME_IOS =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 CriOS/137.0.7151.79 Mobile/15E148 Safari/604.1';
const FIREFOX_IOS =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 FxiOS/139.0 Mobile/15E148 Safari/605.1.15';
const EDGE_IOS =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 EdgiOS/137.0 Mobile/15E148 Safari/605.1.15';

function browser(userAgent: string, overrides: Partial<BrowserIdentity> = {}): BrowserIdentity {
	return {
		userAgent,
		platform: 'MacIntel',
		maxTouchPoints: 0,
		hasBeenActive: false,
		...overrides,
	};
}

describe('WebKit user-activation targeting', () => {
	it.each([SAFARI_MAC, SAFARI_IOS, CHROME_IOS, FIREFOX_IOS, EDGE_IOS])('includes WebKit browser %s', (userAgent) => {
		expect(isLikelyWebKit(browser(userAgent))).toBe(true);
	});

	it('includes iPadOS desktop mode', () => {
		expect(isLikelyWebKit(browser(SAFARI_MAC, { maxTouchPoints: 5 }))).toBe(true);
	});

	it.each([CHROME_MAC, FIREFOX_MAC])('excludes non-WebKit browser %s', (userAgent) => {
		expect(isLikelyWebKit(browser(userAgent))).toBe(false);
	});

	it('requires a cross-origin parent and an unactivated document', () => {
		const environment = {
			selfOrigin: 'https://runner.textmode.art',
			browser: browser(SAFARI_MAC),
		} as UserActivationEnvironment;

		expect(shouldRequestUserActivation('https://editor.textmode.art', environment)).toBe(true);
		expect(shouldRequestUserActivation(environment.selfOrigin, environment)).toBe(false);
		expect(
			shouldRequestUserActivation('https://editor.textmode.art', {
				...environment,
				browser: { ...environment.browser, hasBeenActive: true },
			})
		).toBe(false);
	});
});

describe('UserActivationPrompt', () => {
	it('renders once and removes its runner-owned button on dismissal', () => {
		const remove = vi.fn();
		const appendChild = vi.fn();
		const createElement = vi.fn(() => ({
			type: '',
			className: '',
			textContent: '',
			append: vi.fn(),
			remove,
		}));
		const environment = {
			document: { createElement, body: { appendChild } } as unknown as Document,
			selfOrigin: 'https://runner.textmode.art',
			browser: browser(SAFARI_MAC),
		};
		const prompt = new UserActivationPrompt(() => environment);

		expect(prompt.show('https://editor.textmode.art')).toBe(true);
		expect(prompt.show('https://editor.textmode.art')).toBe(true);
		expect(prompt.isVisible).toBe(true);
		expect(createElement).toHaveBeenCalledTimes(3);
		expect(appendChild).toHaveBeenCalledOnce();

		prompt.dismiss();

		expect(prompt.isVisible).toBe(false);
		expect(remove).toHaveBeenCalledOnce();
	});

	it('does not render for a same-origin parent', () => {
		const createElement = vi.fn();
		const environment = {
			document: { createElement } as unknown as Document,
			selfOrigin: 'https://runner.textmode.art',
			browser: browser(SAFARI_MAC),
		};
		const prompt = new UserActivationPrompt(() => environment);

		expect(prompt.show(environment.selfOrigin)).toBe(false);
		expect(createElement).not.toHaveBeenCalled();
	});
});
