---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / PongMessage

# Interface: PongMessage

Heartbeat response from the runner.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"PONG"` | - |
| <a id="property-nonce"></a> `nonce?` | `string` | Echoed heartbeat nonce. |
| <a id="property-timestamp"></a> `timestamp` | `number` | Runner-side response timestamp. |
