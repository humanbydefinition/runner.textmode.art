# @textmode/runner-client

Browser iframe runtime client for the hosted textmode runner.

This package gives any browser host app a typed runtime API for mounting the
runner iframe, performing the current generic protocol handshake, routing
request/response messages, monitoring heartbeat status, loading fonts,
controlling playback, running code, exporting output, reconnecting, and
disposing the transport.

It does not execute textmode.js sketches directly. It controls a runner app at
the `runnerUrl` you provide.

## Install

```sh
npm install @textmode/runner-client
```

`@textmode/runner-protocol` is installed as a dependency and is also available
for consumers that need the protocol types directly.

## Usage

```ts
import {
	IframeTextmodeRuntime,
	RunnerRequestError,
	type RunnerRuntimeStatus,
} from '@textmode/runner-client';

const container = document.querySelector<HTMLElement>('#runner');

if (!container) {
	throw new Error('missing runner container');
}

const runtime = new IframeTextmodeRuntime({
	runnerUrl: 'https://runner.textmode.art/',
	onStatusChange(status: RunnerRuntimeStatus, reason) {
		console.info('runner status changed', status, reason);
	},
	onExportProgress(requestId, format, progress) {
		console.info('export progress', requestId, format, progress);
	},
});

await runtime.init(container, {
	width: 640,
	height: 640,
	fontSize: 16,
	frameRate: 60,
});

try {
	await runtime.runCode(`
		t.draw(() => {
			t.print('textmode', 0, 0);
		});
	`);
} catch (error) {
	if (error instanceof RunnerRequestError) {
		console.error(error.message, error.line, error.column);
	}
}

const image = await runtime.export('image', {
	format: 'png',
	scale: 2,
});

console.info(image.filename, image.mimeType, image.blob);
runtime.dispose();
```

## Public API

Import from the package root only:

```ts
import { IframeTextmodeRuntime } from '@textmode/runner-client';
```

Public subpath imports are intentionally not supported. Internal modules such
as request routing, heartbeat control, iframe mounting, and sandbox policy may
change without a semver-major release.

The main exports are:

- `IframeTextmodeRuntime`
- `RunnerRuntimeStatus`
- `RunnerExecutionError`
- `RunnerRequestError`
- `FontLoadResult`
- `IframeTextmodeRuntimeOptions`
- `IframeMountMode`
- `IframeSandboxToken`
- `DEFAULT_IFRAME_SANDBOX_TOKENS`

## Runtime Lifecycle

Typical host apps follow this lifecycle:

1. Create an `IframeTextmodeRuntime` with a trusted `runnerUrl`.
2. Call `init(container, settings)` from a browser context.
3. Use `runCode`, `configure`, `setSettings`, `export`, `loadFont`, and
   `playback` as needed.
4. Call `reconnect` after a recoverable runner failure.
5. Call `dispose` when the host view is unmounted.

The runtime exposes `status`, `isReady`, and `frame` getters for host UI state.

## Sandbox Policy

The default iframe sandbox tokens are:

```ts
['allow-scripts', 'allow-same-origin']
```

`allow-downloads` is not included by default. Export downloads should be
initiated by the host app after it receives an export result from the runner.

The runtime refuses to start a runner that combines `allow-scripts` and
`allow-same-origin` on the same origin as the parent page.

## API Docs

Generated TypeDoc Markdown lives in [`api/runner-client`](./api/runner-client/index.md).

## License

AGPL-3.0-or-later. See [LICENSE](./LICENSE).
