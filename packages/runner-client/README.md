# @textmode/runner-client

Browser iframe runtime client for the hosted textmode runner.

This package gives any browser host app a typed runtime API for mounting the
runner iframe, performing the current generic protocol handshake, routing
request/response messages, monitoring heartbeat status, running code,
reconnecting, and disposing the transport.

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
});

await runtime.init(container);

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
- `IframeTextmodeRuntimeOptions`
- `IframeMountMode`
- `IframeSandboxToken`
- `DEFAULT_IFRAME_SANDBOX_TOKENS`

## Runtime Lifecycle

Typical host apps follow this lifecycle:

1. Create an `IframeTextmodeRuntime` with a trusted `runnerUrl`.
2. Call `init(container)` from a browser context.
3. Use `runCode` to replace the current sketch execution while preserving its timeline.
4. Use `resetRuntime` to rebuild textmode while preserving the current iframe document and its browser interaction state.
5. Call `reconnect` only when the iframe document or transport must be replaced.
6. Call `dispose` when the host view is unmounted.

`resetRuntime` falls back to reconnecting when an older runner does not advertise the optional `runtimeReset` capability.

The runtime exposes `status`, `isReady`, and `frame` getters for host UI state.

## Sandbox Policy

The default iframe sandbox tokens are:

```ts
['allow-scripts', 'allow-same-origin']
```

`allow-downloads` is not included by default. Sketches can use the installed
`textmode.export.js` helpers inside the sandboxed runtime, but the host client
does not expose a parent-controlled export channel.

The runtime refuses to start a runner that combines `allow-scripts` and
`allow-same-origin` on the same origin as the parent page.

## API Docs

Generated TypeDoc Markdown lives in [`api/runner-client`](./api/runner-client/index.md).

## License

AGPL-3.0-or-later. See [LICENSE](./LICENSE).
