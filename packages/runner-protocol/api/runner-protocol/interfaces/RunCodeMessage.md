---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / RunCodeMessage

# Interface: RunCodeMessage

Request to execute code in the runner.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"RUN_CODE"` | - |
| <a id="property-code"></a> `code` | `string` | Source code to execute. |
| <a id="property-requestid"></a> `requestId?` | `string` | Optional request identifier for result routing. |
