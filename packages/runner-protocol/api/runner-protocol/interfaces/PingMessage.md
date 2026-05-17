---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / PingMessage

# Interface: PingMessage

Heartbeat request sent by a host app.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"PING"` | - |
| <a id="property-nonce"></a> `nonce?` | `string` | Optional nonce echoed by the runner. |
