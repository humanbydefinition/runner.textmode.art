---
layout: doc
editLink: true
---

# @textmode/runner-client

Browser iframe runtime client for the hosted textmode runner.

`@textmode/runner-client` manages the runner iframe lifecycle, current
protocol handshake, request/response routing, heartbeat monitoring, export
helpers, font loading, playback control, reconnect, and disposal for host
apps.

## Errors

| Name | Description |
| ------ | ------ |
| [RunnerExecutionError](interfaces/RunnerExecutionError.md) | Error shape surfaced by runner execution callbacks and rejected run requests. |
| [RunnerRequestError](classes/RunnerRequestError.md) | Error used when a request-scoped runner execution fails. |

## Fonts

| Interface | Description |
| ------ | ------ |
| [FontLoadResult](interfaces/FontLoadResult.md) | Metadata returned after the runner successfully loads a font file. |

## Options

| Name | Description |
| ------ | ------ |
| [IframeSandboxToken](type-aliases/IframeSandboxToken.md) | Iframe sandbox token supported by the runner client. |
| [IframeMountMode](type-aliases/IframeMountMode.md) | How the runner iframe should be mounted into its container. |
| [DEFAULT\_IFRAME\_SANDBOX\_TOKENS](variables/DEFAULT_IFRAME_SANDBOX_TOKENS.md) | Default sandbox tokens used by the runner iframe. |
| [IframeTextmodeRuntimeOptions](interfaces/IframeTextmodeRuntimeOptions.md) | Options for [IframeTextmodeRuntime](classes/IframeTextmodeRuntime.md). |

## Runtime

| Name | Description |
| ------ | ------ |
| [IframeTextmodeRuntime](classes/IframeTextmodeRuntime.md) | Browser iframe runtime for communicating with the hosted textmode runner. |
| [RunnerRuntimeStatus](type-aliases/RunnerRuntimeStatus.md) | Lifecycle state for an iframe runner connection. |
