---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / RunnerCapabilities

# Interface: RunnerCapabilities

Feature flags advertised by a ready runner iframe.

Capabilities describe the small host-facing runner contract. In-sketch
textmode plugin APIs are not advertised here because they are part of the
sandboxed runtime, not the parent iframe protocol.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-heartbeat"></a> `heartbeat` | `boolean` | Whether the runner responds to heartbeat pings. |
| <a id="property-runtimereset"></a> `runtimeReset?` | `boolean` | Whether the runner can rebuild its textmode runtime without replacing the iframe document. |
