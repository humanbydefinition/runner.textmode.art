---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / RunOkMessage

# Interface: RunOkMessage

Successful code execution result.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"RUN_OK"` | - |
| <a id="property-timestamp"></a> `timestamp` | `number` | Runner-side completion timestamp. |
| <a id="property-requestid"></a> `requestId?` | `string` | Request identifier when the run was initiated by a request/response host. |
