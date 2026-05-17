---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / SoftResetMessage

# Interface: SoftResetMessage

Request to reset frame state and execute code.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"SOFT_RESET"` | - |
| <a id="property-code"></a> `code` | `string` | Source code to execute after soft reset. |
| <a id="property-requestid"></a> `requestId?` | `string` | Optional request identifier for result routing. |
