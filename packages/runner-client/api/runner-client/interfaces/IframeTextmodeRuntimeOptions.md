---
layout: doc
editLink: true
---

[@textmode/runner-client](../index.md) / IframeTextmodeRuntimeOptions

# Interface: IframeTextmodeRuntimeOptions

Options for [IframeTextmodeRuntime](../classes/IframeTextmodeRuntime.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-runnerurl"></a> `runnerUrl` | `string` | Absolute or parent-relative URL for the hosted runner app. |
| <a id="property-mountmode"></a> `mountMode?` | [`IframeMountMode`](../type-aliases/IframeMountMode.md) | Iframe mount behavior. Defaults to `replace`. |
| <a id="property-sandboxtokens"></a> `sandboxTokens?` | [`IframeSandboxToken`](../type-aliases/IframeSandboxToken.md)[] | Sandbox tokens applied to the runner iframe. |
| <a id="property-handshaketimeoutms"></a> `handshakeTimeoutMs?` | `number` | Timeout for the initial iframe MessagePort handshake. |
| <a id="property-requesttimeoutms"></a> `requestTimeoutMs?` | `number` | Default timeout for request/response runner messages. |
| <a id="property-heartbeatintervalms"></a> `heartbeatIntervalMs?` | `number` | Interval between heartbeat pings. |
| <a id="property-heartbeattimeoutms"></a> `heartbeatTimeoutMs?` | `number` | Maximum time without a heartbeat pong before the runner is marked hung. |
| <a id="property-onready"></a> `onReady?` | (`capabilities`) => `void` | Called after the runner is ready and optional runtime configuration succeeds. |
| <a id="property-onrunok"></a> `onRunOk?` | (`message`) => `void` | Called when code execution succeeds. |
| <a id="property-onrunerror"></a> `onRunError?` | (`error`) => `void` | Called for non-request-scoped runner execution errors. |
| <a id="property-onsyntherror"></a> `onSynthError?` | (`message`) => `void` | Called when the runner reports a synth parameter error. |
| <a id="property-ontoggleui"></a> `onToggleUI?` | () => `void` | Called when the runner requests host UI visibility changes. |
| <a id="property-onuserinteraction"></a> `onUserInteraction?` | () => `void` | Called when the runner reports user interaction. |
| <a id="property-onexportprogress"></a> `onExportProgress?` | (`requestId`, `format`, `progress`) => `void` | Called as multi-frame exports report progress. |
| <a id="property-onplaybackstate"></a> `onPlaybackState?` | (`state`) => `void` | Called whenever the runner reports playback state. |
| <a id="property-onunavailable"></a> `onUnavailable?` | (`reason`, `status`) => `void` | Called when the runner becomes unavailable or hung. |
| <a id="property-onconnected"></a> `onConnected?` | () => `void` | Called after the MessagePort connection is established. |
| <a id="property-onstatuschange"></a> `onStatusChange?` | (`status`, `reason?`) => `void` | Called whenever runtime lifecycle status changes. |
