---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / ReadyMessage

# Interface: ReadyMessage

Runner readiness message sent after a successful iframe handshake.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"READY"` | - |
| <a id="property-capabilities"></a> `capabilities` | [`RunnerCapabilities`](RunnerCapabilities.md) | Feature set supported by this runner. |
