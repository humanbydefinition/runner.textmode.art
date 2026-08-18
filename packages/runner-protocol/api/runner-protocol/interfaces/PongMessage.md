---
layout: doc
editLink: false
title: PongMessage
description: Heartbeat response from the runner.
category: Interfaces
api: true
kind: Interface
lastModified: 2026-08-18
isInterface: true
---

[@textmode/runner-protocol](../index.md) / PongMessage

# Interface: PongMessage

Heartbeat response from the runner.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-nonce"></a> `nonce?` | `string` | Echoed heartbeat nonce. |
| <a id="property-timestamp"></a> `timestamp` | `number` | Runner-side response timestamp. |
| <a id="property-type"></a> `type` | `"PONG"` | - |
