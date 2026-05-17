---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / RunnerCapabilities

# Interface: RunnerCapabilities

Feature flags advertised by a ready runner iframe.

Capabilities describe feature availability only. They are not a runtime
protocol version negotiation mechanism.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-runtimeconfig"></a> `runtimeConfig` | `boolean` | Whether fixed runtime settings can be configured before execution. |
| <a id="property-exports"></a> `exports` | (`"image"` \| `"svg"` \| `"txt"` \| `"gif"` \| `"webm"`)[] | Export formats available through the runner. |
| <a id="property-fonts"></a> `fonts` | `boolean` | Whether host apps can load fonts into the runner. |
| <a id="property-playback"></a> `playback` | `boolean` | Whether playback controls and state reporting are available. |
| <a id="property-heartbeat"></a> `heartbeat` | `boolean` | Whether the runner responds to heartbeat pings. |
