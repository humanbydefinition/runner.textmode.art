import { createRunnerCapabilities, type RunnerToParentMessage } from '@textmode/runner-protocol';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IframeTextmodeRuntime, RunnerRequestError } from '../src/index';
import { mountRunnerIframe } from '../src/internal/iframeMount';
import { RequestRegistry, requestKindForMessage } from '../src/internal/requestRegistry';
import { assertSandboxOriginPolicy } from '../src/internal/sandboxPolicy';
import { DEFAULT_IFRAME_SANDBOX_TOKENS } from '../src/options';

class FakeSandbox {
	readonly tokens: string[] = [];

	add(...tokens: string[]): void {
		this.tokens.push(...tokens);
	}
}

class FakeStyle {
	width = '';
	height = '';
	border = '';
	display = '';
	background = '';
	transition = '';
	opacity = '';

	setProperty(name: string, value: string): void {
		(this as unknown as Record<string, string>)[name] = value;
	}
}

class FakeIframe {
	id = '';
	title = '';
	src = '';
	referrerPolicy = '';
	tabIndex = 0;
	isConnected = false;
	readonly sandbox = new FakeSandbox();
	readonly style = new FakeStyle();
	readonly contentWindow = {
		postMessage: vi.fn(),
		focus: vi.fn(),
	};
	readonly focus = vi.fn();
	private readonly listeners = new Map<string, Array<() => void>>();

	addEventListener(type: string, listener: () => void): void {
		this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
	}

	remove(): void {
		this.isConnected = false;
	}

	dispatch(type: string): void {
		for (const listener of this.listeners.get(type) ?? []) {
			listener();
		}
	}
}

class FakeContainer {
	readonly children: FakeIframe[] = [];
	readonly appendChild = vi.fn((child: FakeIframe) => {
		child.isConnected = true;
		this.children.push(child);
		return child;
	});
	readonly replaceChildren = vi.fn((...children: FakeIframe[]) => {
		for (const child of this.children) {
			child.isConnected = false;
		}
		this.children.length = 0;
		for (const child of children) {
			child.isConnected = true;
			this.children.push(child);
		}
	});
}

class FakeMessagePort {
	onmessage: ((event: MessageEvent<RunnerToParentMessage>) => void) | null = null;
	readonly sent: unknown[] = [];
	readonly sentTransfers: unknown[][] = [];
	readonly start = vi.fn();
	readonly close = vi.fn();
	readonly postMessage = vi.fn((message: unknown, transfer?: unknown[]) => {
		this.sent.push(message);
		this.sentTransfers.push(transfer ?? []);
	});

	deliver(message: RunnerToParentMessage | unknown): void {
		this.onmessage?.({ data: message } as MessageEvent<RunnerToParentMessage>);
	}
}

let lastChannel: FakeMessageChannel | null = null;

function rememberChannel(channel: FakeMessageChannel): void {
	lastChannel = channel;
}

class FakeMessageChannel {
	readonly port1 = new FakeMessagePort();
	readonly port2 = new FakeMessagePort();

	constructor() {
		rememberChannel(this);
	}
}

interface FakeBrowserEnvironment {
	container: FakeContainer;
	createdIframes: FakeIframe[];
	get iframe(): FakeIframe;
	get channel(): FakeMessageChannel;
}

const capabilities = createRunnerCapabilities();

function installFakeBrowser(parentHref = 'https://editor.textmode.art/'): FakeBrowserEnvironment {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-05-17T00:00:00Z'));

	lastChannel = null;
	const createdIframes: FakeIframe[] = [];
	const container = new FakeContainer();
	const parentUrl = new URL(parentHref);

	vi.stubGlobal('window', {
		location: {
			href: parentUrl.href,
			origin: parentUrl.origin,
		},
		setTimeout: globalThis.setTimeout,
		clearTimeout: globalThis.clearTimeout,
		setInterval: globalThis.setInterval,
		clearInterval: globalThis.clearInterval,
	});
	vi.stubGlobal('document', {
		createElement: vi.fn((tagName: string) => {
			if (tagName !== 'iframe') {
				throw new Error(`unexpected element: ${tagName}`);
			}

			const iframe = new FakeIframe();
			createdIframes.push(iframe);
			return iframe;
		}),
	});
	vi.stubGlobal('MessageChannel', FakeMessageChannel);

	return {
		container,
		createdIframes,
		get iframe() {
			const iframe = createdIframes.at(-1);
			if (!iframe) throw new Error('no iframe has been created');
			return iframe;
		},
		get channel() {
			if (!lastChannel) throw new Error('no message channel has been created');
			return lastChannel;
		},
	};
}

async function connectRuntime(
	options: Partial<ConstructorParameters<typeof IframeTextmodeRuntime>[0]> = {}
): Promise<{ runtime: IframeTextmodeRuntime; env: FakeBrowserEnvironment }> {
	const env = installFakeBrowser();
	const runtime = new IframeTextmodeRuntime({
		runnerUrl: 'https://runner.textmode.art/',
		heartbeatIntervalMs: 1000,
		heartbeatTimeoutMs: 5000,
		...options,
	});

	const readyPromise = runtime.init(env.container as unknown as HTMLElement);
	env.iframe.dispatch('load');
	env.channel.port1.deliver({ type: 'READY', capabilities });
	await readyPromise;

	return { runtime, env };
}

describe('@textmode/runner-client', () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('does not include allow-downloads in the default iframe sandbox', () => {
		expect(DEFAULT_IFRAME_SANDBOX_TOKENS).toEqual(['allow-scripts', 'allow-same-origin']);
		expect(DEFAULT_IFRAME_SANDBOX_TOKENS).not.toContain('allow-downloads');
	});

	it('refuses allow-scripts plus allow-same-origin when runner shares the parent origin', () => {
		expect(() =>
			assertSandboxOriginPolicy({
				sandboxTokens: DEFAULT_IFRAME_SANDBOX_TOKENS,
				runnerOrigin: 'https://editor.textmode.art',
				parentOrigin: 'https://editor.textmode.art',
			})
		).toThrow('Refusing to start sandbox runner with allow-scripts and allow-same-origin on the parent origin');
	});

	it('mounts iframe with replace and append modes', () => {
		const replaceContainer = new FakeContainer();
		const appendContainer = new FakeContainer();
		const first = new FakeIframe();
		const second = new FakeIframe();

		mountRunnerIframe(replaceContainer as unknown as HTMLElement, first as unknown as HTMLIFrameElement, 'replace');
		mountRunnerIframe(replaceContainer as unknown as HTMLElement, second as unknown as HTMLIFrameElement, 'replace');
		mountRunnerIframe(appendContainer as unknown as HTMLElement, first as unknown as HTMLIFrameElement, 'append');
		mountRunnerIframe(appendContainer as unknown as HTMLElement, second as unknown as HTMLIFrameElement, 'append');

		expect(replaceContainer.replaceChildren).toHaveBeenCalledTimes(2);
		expect(replaceContainer.children).toEqual([second]);
		expect(appendContainer.appendChild).toHaveBeenCalledTimes(2);
		expect(appendContainer.children).toEqual([first, second]);
	});

	it('tracks request resolve, reject, timeout, and message kind', async () => {
		const env = installFakeBrowser();
		const registry = new RequestRegistry();
		const timeoutHandler = vi.fn();

		const resolved = registry.register<string>({
			requestId: 'run_1',
			kind: 'run',
			messageType: 'RUN_CODE',
			timeoutMs: 1000,
			onTimeout: timeoutHandler,
		});
		expect(registry.resolve('run_1', 'ok')).toBe(true);
		await expect(resolved).resolves.toBe('ok');

		const rejected = registry.register<string>({
			requestId: 'export_1',
			kind: 'export',
			messageType: 'EXPORT',
			timeoutMs: 1000,
			onTimeout: timeoutHandler,
		});
		expect(registry.reject('export_1', new Error('failed'))).toBe(true);
		await expect(rejected).rejects.toThrow('failed');

		const timedOut = registry.register<string>({
			requestId: 'font_1',
			kind: 'font',
			messageType: 'LOAD_FONT',
			timeoutMs: 1000,
			onTimeout: timeoutHandler,
		});
		vi.advanceTimersByTime(1000);
		await expect(timedOut).rejects.toThrow('runner request timed out: LOAD_FONT');
		expect(timeoutHandler).toHaveBeenCalledTimes(1);
		expect(requestKindForMessage('PLAYBACK')).toBe('playback');
		expect(env.container.children).toEqual([]);
	});

	it('sends the current INIT shape during handshake', async () => {
		const env = installFakeBrowser();
		const runtime = new IframeTextmodeRuntime({
			runnerUrl: 'https://runner.textmode.art/',
		});

		const readyPromise = runtime.init(env.container as unknown as HTMLElement);
		env.iframe.dispatch('load');

		expect(env.iframe.contentWindow.postMessage).toHaveBeenCalledWith(
			{ type: 'INIT' },
			'https://runner.textmode.art',
			[env.channel.port2]
		);

		env.channel.port1.deliver({ type: 'READY', capabilities });
		await expect(readyPromise).resolves.toBe(true);
		runtime.dispose();
	});

	it('ignores malformed runner messages', async () => {
		const onRunOk = vi.fn();
		const { runtime, env } = await connectRuntime({ onRunOk });

		env.channel.port1.deliver({ type: 'RUN_OK', timestamp: 'bad' });

		expect(onRunOk).not.toHaveBeenCalled();
		runtime.dispose();
	});

	it('rejects READY messages with missing required capabilities', async () => {
		const onUnavailable = vi.fn();
		const env = installFakeBrowser();
		const runtime = new IframeTextmodeRuntime({
			runnerUrl: 'https://runner.textmode.art/',
			onUnavailable,
		});

		const readyPromise = runtime.init(env.container as unknown as HTMLElement);
		env.iframe.dispatch('load');
		env.channel.port1.deliver({
			type: 'READY',
			capabilities: {
				...capabilities,
				runtimeConfig: false,
			},
		});

		await expect(readyPromise).rejects.toThrow('runner does not support runtime configuration');
		expect(runtime.status).toBe('unavailable');
		expect(onUnavailable).toHaveBeenCalledWith('runner does not support runtime configuration', 'unavailable');
	});

	it('routes run success and request-scoped run errors', async () => {
		const { runtime, env } = await connectRuntime();

		const ok = runtime.runCode('t.draw(() => {})');
		const runMessage = env.channel.port1.sent.at(-1) as { requestId: string; type: string };
		expect(runMessage).toMatchObject({ type: 'RUN_CODE', code: 't.draw(() => {})' });
		env.channel.port1.deliver({ type: 'RUN_OK', timestamp: Date.now(), requestId: runMessage.requestId });
		await expect(ok).resolves.toBe(true);

		const failed = runtime.runCode('bad code');
		const failedMessage = env.channel.port1.sent.at(-1) as { requestId: string };
		env.channel.port1.deliver({
			type: 'RUN_ERROR',
			message: 'SyntaxError',
			line: 4,
			column: 2,
			requestId: failedMessage.requestId,
		});
		await expect(failed).rejects.toBeInstanceOf(RunnerRequestError);
		await expect(failed).rejects.toMatchObject({ line: 4, column: 2 });
		runtime.dispose();
	});

	it('routes export progress/result, font load, playback state, and pongs', async () => {
		const onExportProgress = vi.fn();
		const onPlaybackState = vi.fn();
		const { runtime, env } = await connectRuntime({ onExportProgress, onPlaybackState });

		const gif = runtime.exportGif({ frameCount: 2 });
		const gifMessage = env.channel.port1.sent.at(-1) as { requestId: string };
		env.channel.port1.deliver({
			type: 'EXPORT_PROGRESS',
			requestId: gifMessage.requestId,
			format: 'gif',
			progress: { state: 'recording', frameIndex: 1, totalFrames: 2 },
		});
		env.channel.port1.deliver({
			type: 'EXPORT_RESULT',
			requestId: gifMessage.requestId,
			format: 'gif',
			mimeType: 'image/gif',
		});
		await expect(gif).resolves.toMatchObject({ format: 'gif' });
		expect(onExportProgress).toHaveBeenCalledWith(gifMessage.requestId, 'gif', {
			state: 'recording',
			frameIndex: 1,
			totalFrames: 2,
		});

		const buffer = new ArrayBuffer(8);
		const font = runtime.loadFont({
			name: 'Example.woff',
			type: 'font/woff',
			arrayBuffer: async () => buffer,
		} as File);
		await Promise.resolve();
		const fontMessage = env.channel.port1.sent.at(-1) as { requestId: string };
		expect(env.channel.port1.sentTransfers.at(-1)).toEqual([buffer]);
		env.channel.port1.deliver({
			type: 'FONT_LOADED',
			requestId: fontMessage.requestId,
			familyName: 'Example',
			characters: ['A'],
		});
		await expect(font).resolves.toEqual({ familyName: 'Example', characters: ['A'] });

		const badFont = runtime.loadFont({
			name: 'Broken.woff',
			type: 'font/woff',
			arrayBuffer: async () => new ArrayBuffer(4),
		} as File);
		await Promise.resolve();
		const badFontMessage = env.channel.port1.sent.at(-1) as { requestId: string };
		env.channel.port1.deliver({
			type: 'FONT_ERROR',
			requestId: badFontMessage.requestId,
			message: 'font rejected',
		});
		await expect(badFont).rejects.toThrow('font rejected');

		const playback = runtime.playback('seek', { frame: 12 });
		const playbackMessage = env.channel.port1.sent.at(-1) as { requestId: string };
		env.channel.port1.deliver({
			type: 'PLAYBACK_STATE',
			requestId: playbackMessage.requestId,
			state: { isPlaying: false, frame: 12, maxFrames: 120 },
		});
		await expect(playback).resolves.toEqual({ isPlaying: false, frame: 12, maxFrames: 120 });
		expect(onPlaybackState).toHaveBeenCalledWith({ isPlaying: false, frame: 12, maxFrames: 120 });

		vi.advanceTimersByTime(1000);
		expect((env.channel.port1.sent.at(-1) as { type: string }).type).toBe('PING');
		env.channel.port1.deliver({ type: 'PONG', nonce: 'ping_1', timestamp: Date.now() });
		runtime.dispose();
	});

	it('marks the runner hung after a heartbeat timeout', async () => {
		const onUnavailable = vi.fn();
		const { runtime } = await connectRuntime({
			heartbeatIntervalMs: 100,
			heartbeatTimeoutMs: 150,
			onUnavailable,
		});

		vi.advanceTimersByTime(100);
		vi.advanceTimersByTime(100);

		expect(onUnavailable).toHaveBeenCalledWith('runner heartbeat timed out', 'hung');
		expect(runtime.status).toBe('hung');
	});

	it('reconnects and reruns the last requested code', async () => {
		const { runtime, env } = await connectRuntime();

		const firstRun = runtime.runCode('t.draw(() => {})');
		const firstRunMessage = env.channel.port1.sent.at(-1) as { requestId: string };
		env.channel.port1.deliver({ type: 'RUN_OK', timestamp: Date.now(), requestId: firstRunMessage.requestId });
		await firstRun;

		const reconnect = runtime.reconnect();
		const reconnectedIframe = env.createdIframes.at(-1)!;
		reconnectedIframe.dispatch('load');
		env.channel.port1.deliver({ type: 'READY', capabilities });
		await reconnect;
		await Promise.resolve();

		expect(env.channel.port1.sent.at(-1)).toMatchObject({
			type: 'RUN_CODE',
			code: 't.draw(() => {})',
		});
		const rerunMessage = env.channel.port1.sent.at(-1) as { requestId: string };
		env.channel.port1.deliver({ type: 'RUN_OK', timestamp: Date.now(), requestId: rerunMessage.requestId });
		runtime.dispose();
	});

	it('closes transport and rejects pending requests on dispose', async () => {
		const { runtime, env } = await connectRuntime();

		const pendingRun = runtime.runCode('t.draw(() => {})');
		runtime.dispose();

		expect(env.channel.port1.close).toHaveBeenCalled();
		expect(env.channel.port2.close).toHaveBeenCalled();
		expect(runtime.status).toBe('idle');
		await expect(pendingRun).rejects.toThrow('runner disposed');
	});
});
