---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / ResetRuntimeMessage

# Interface: ResetRuntimeMessage

Request to rebuild the textmode runtime inside the existing iframe document.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"RESET_RUNTIME"` | - |
| <a id="property-code"></a> `code` | `string` | Source code to execute in the fresh textmode runtime. |
| <a id="property-requestid"></a> `requestId` | `string` | Request identifier used for result routing. |
