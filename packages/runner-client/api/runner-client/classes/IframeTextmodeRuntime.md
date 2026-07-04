---
layout: doc
editLink: true
---

[@textmode/runner-client](../index.md) / IframeTextmodeRuntime

# Class: IframeTextmodeRuntime

Browser iframe runtime for communicating with the hosted textmode runner.

## Constructors

### Constructor

```ts
new IframeTextmodeRuntime(options): IframeTextmodeRuntime;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`IframeTextmodeRuntimeOptions`](../interfaces/IframeTextmodeRuntimeOptions.md) |

#### Returns

`IframeTextmodeRuntime`

## Runtime

### isReady

#### Get Signature

```ts
get isReady(): boolean;
```

Whether the runner iframe is ready to accept requests.

##### Returns

`boolean`

***

### frame

#### Get Signature

```ts
get frame(): HTMLIFrameElement | null;
```

Current runner iframe element, when mounted.

##### Returns

`HTMLIFrameElement` \| `null`

***

### status

#### Get Signature

```ts
get status(): RunnerRuntimeStatus;
```

Current runner lifecycle status.

##### Returns

[`RunnerRuntimeStatus`](../type-aliases/RunnerRuntimeStatus.md)

***

### runnerStatus

#### Get Signature

```ts
get runnerStatus(): RunnerRuntimeStatus;
```

Alias for [IframeTextmodeRuntime.status](#status).

##### Returns

[`RunnerRuntimeStatus`](../type-aliases/RunnerRuntimeStatus.md)

***

### advertisedCapabilities

#### Get Signature

```ts
get advertisedCapabilities(): RunnerCapabilities | null;
```

Capabilities advertised by the connected runner.

##### Returns

`RunnerCapabilities` \| `null`

***

### init()

```ts
init(container): Promise<boolean>;
```

Mounts the runner iframe and performs the current protocol handshake.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `container` | `HTMLElement` | DOM element that should contain the runner iframe. |

#### Returns

`Promise`\<`boolean`\>

`true` when the runner is ready.

***

### dispose()

```ts
dispose(): void;
```

Disposes the iframe connection and rejects pending requests.

#### Returns

`void`

***

### reconnect()

```ts
reconnect(): Promise<boolean>;
```

Recreates the iframe and reruns the last requested code when available.

#### Returns

`Promise`\<`boolean`\>

`true` when reconnection succeeds.

***

### activateFromUserGesture()

```ts
activateFromUserGesture(): void;
```

Focuses the iframe from a host user gesture.

Some browsers use this to unlock normal iframe animation cadence.

#### Returns

`void`

***

### runCode()

```ts
runCode(code, options?): Promise<boolean>;
```

Executes code in the runner.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `code` | `string` |
| `options` | \{ `softReset?`: `boolean`; \} |
| `options.softReset?` | `boolean` |

#### Returns

`Promise`\<`boolean`\>
