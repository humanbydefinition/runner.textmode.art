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

## Exports

### export()

```ts
export(
   format, 
   options?, 
timeoutMs?): Promise<ExportResultMessage>;
```

Exports the current runner output in any supported format.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `format` | `"gif"` \| `"webm"` \| `"image"` \| `"svg"` \| `"txt"` |
| `options?` | \| `ImageExportOptions` \| `SvgExportOptions` \| `TxtExportOptions` \| `GifExportOptions` \| `WebmExportOptions` |
| `timeoutMs?` | `number` |

#### Returns

`Promise`\<`ExportResultMessage`\>

***

### exportImage()

```ts
exportImage(options): Promise<ExportResultMessage>;
```

Exports the current runner output as a raster image.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `ImageExportOptions` |

#### Returns

`Promise`\<`ExportResultMessage`\>

***

### exportSvg()

```ts
exportSvg(options): Promise<ExportResultMessage>;
```

Exports the current runner output as SVG.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `SvgExportOptions` |

#### Returns

`Promise`\<`ExportResultMessage`\>

***

### exportTxt()

```ts
exportTxt(options): Promise<ExportResultMessage>;
```

Exports the current runner output as plain text.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `TxtExportOptions` |

#### Returns

`Promise`\<`ExportResultMessage`\>

***

### exportGif()

```ts
exportGif(options): Promise<ExportResultMessage>;
```

Records an animated GIF export.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `GifExportOptions` |

#### Returns

`Promise`\<`ExportResultMessage`\>

***

### exportWebm()

```ts
exportWebm(options): Promise<ExportResultMessage>;
```

Records a WebM export.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `WebmExportOptions` |

#### Returns

`Promise`\<`ExportResultMessage`\>

## Fonts

### loadFont()

```ts
loadFont(file): Promise<FontLoadResult>;
```

Loads a font file into the runner.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `file` | `File` |

#### Returns

`Promise`\<[`FontLoadResult`](../interfaces/FontLoadResult.md)\>

## Playback

### playback()

```ts
playback(action, options?): Promise<PlaybackState>;
```

Sends a playback command and resolves with the resulting playback state.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `action` | `PlaybackAction` |
| `options` | \{ `frame?`: `number`; `maxFrames?`: `number`; \} |
| `options.frame?` | `number` |
| `options.maxFrames?` | `number` |

#### Returns

`Promise`\<`PlaybackState`\>

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
init(container, settings?): Promise<boolean>;
```

Mounts the runner iframe and performs the current protocol handshake.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `container` | `HTMLElement` | DOM element that should contain the runner iframe. |
| `settings?` | `RuntimeSettings` | Optional fixed runtime settings to configure after ready. |

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

### configure()

```ts
configure(settings): Promise<PlaybackState | null>;
```

Configures complete fixed runtime settings.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `settings` | `RuntimeSettings` |

#### Returns

`Promise`\<`PlaybackState` \| `null`\>

***

### setSettings()

```ts
setSettings(settings): Promise<PlaybackState | null>;
```

Applies a partial runtime settings update.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `settings` | `Partial`\<`RuntimeSettings`\> |

#### Returns

`Promise`\<`PlaybackState` \| `null`\>

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
