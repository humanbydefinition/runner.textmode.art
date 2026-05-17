---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / RunErrorMessage

# Interface: RunErrorMessage

Code execution failure result.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"RUN_ERROR"` | - |
| <a id="property-message"></a> `message` | `string` | Human-readable error message. |
| <a id="property-stack"></a> `stack?` | `string` | Optional stack trace. |
| <a id="property-line"></a> `line?` | `number` | Optional 1-based source line. |
| <a id="property-column"></a> `column?` | `number` | Optional 1-based source column. |
| <a id="property-requestid"></a> `requestId?` | `string` | Request identifier when the failure belongs to a request/response call. |
