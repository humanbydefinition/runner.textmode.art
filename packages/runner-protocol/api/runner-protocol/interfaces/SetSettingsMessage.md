---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / SetSettingsMessage

# Interface: SetSettingsMessage

Request to update part of the current runtime settings.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"SET_SETTINGS"` | - |
| <a id="property-settings"></a> `settings` | `Partial`\<[`RuntimeSettings`](RuntimeSettings.md)\> | Partial runtime settings to apply. |
| <a id="property-requestid"></a> `requestId?` | `string` | Optional request identifier for result routing. |
