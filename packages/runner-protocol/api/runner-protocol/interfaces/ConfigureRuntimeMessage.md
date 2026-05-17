---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / ConfigureRuntimeMessage

# Interface: ConfigureRuntimeMessage

Request to initialize or reconfigure fixed runtime settings.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"CONFIGURE_RUNTIME"` | - |
| <a id="property-settings"></a> `settings` | [`RuntimeSettings`](RuntimeSettings.md) | Complete runtime settings. |
| <a id="property-requestid"></a> `requestId?` | `string` | Optional request identifier for result routing. |
