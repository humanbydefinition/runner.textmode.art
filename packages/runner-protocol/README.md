# @textmode/runner-protocol

Shared TypeScript message contract for the hosted textmode runner iframe.

This package is the single source of truth for the wire messages exchanged by
the runner and browser host apps in the textmode.js ecosystem.
It contains the public message types, capability model, runtime settings,
export/playback/font payloads, and runtime validators used on both sides of the
iframe boundary.

## Install

```sh
npm install @textmode/runner-protocol
```

## Usage

```ts
import {
	createRunnerCapabilities,
	isParentMessage,
	isRunnerMessage,
	type ParentToRunnerMessage,
	type RunnerToParentMessage,
} from '@textmode/runner-protocol';

const capabilities = createRunnerCapabilities();

function handleParentMessage(message: unknown): void {
	if (!isParentMessage(message)) {
		return;
	}

	runMessage(message);
}

function sendRunnerMessage(message: RunnerToParentMessage): void {
	if (isRunnerMessage(message)) {
		port.postMessage(message);
	}
}

function runMessage(message: ParentToRunnerMessage): void {
	switch (message.type) {
		case 'RUN_CODE':
			runCode(message.code, message.requestId);
			break;
		case 'PING':
			port.postMessage({ type: 'PONG', nonce: message.nonce, timestamp: Date.now() });
			break;
	}
}
```

## Public API

Import from the package root only:

```ts
import { isRunnerMessage, type RuntimeSettings } from '@textmode/runner-protocol';
```

Public subpath imports are intentionally not supported. This keeps the protocol
package free to reorganize internal modules without breaking consumers.

The main exports are grouped around:

- capabilities: `RunnerCapabilities`, `ExportFormat`,
  `createRunnerCapabilities`
- runtime settings: `RuntimeSettings`
- exports: image, SVG, TXT, GIF, and WebM option/result/progress types
- playback: `PlaybackAction`, `PlaybackState`
- messages: `InitMessage`, `ParentToRunnerMessage`, `RunnerToParentMessage`,
  `Message`
- guards: `isInitMessage`, `isParentMessage`, `isRunnerMessage`,
  `isRunnerCapabilities`

## Protocol Model

The runner protocol has one current message shape. Runtime protocol version
negotiation is intentionally absent: npm package semver describes source
compatibility, while runner feature availability is described through
capabilities.

The initial window message is generic for every host app:

```ts
{ type: 'INIT' }
```

After a successful handshake, the runner responds with:

```ts
{ type: 'READY', capabilities: RunnerCapabilities }
```

Messages sent after that point use the `ParentToRunnerMessage` and
`RunnerToParentMessage` unions.

## Validation

The exported guards are strict runtime validators for untrusted `postMessage`
payloads. Use them before dispatching messages across the iframe boundary:

```ts
if (!isRunnerMessage(event.data)) {
	return;
}
```

The guards reject retired app-identity and protocol-version fields such as
`client`, `v`, `clients`, and `protocolVersions`.

## API Docs

Generated TypeDoc Markdown lives in [`api/runner-protocol`](./api/runner-protocol/index.md).

## License

CC0-1.0. See [LICENSE](./LICENSE).
