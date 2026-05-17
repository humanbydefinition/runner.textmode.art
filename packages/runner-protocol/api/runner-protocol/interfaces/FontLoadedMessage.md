---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / FontLoadedMessage

# Interface: FontLoadedMessage

Successful font load result.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"FONT_LOADED"` | - |
| <a id="property-requestid"></a> `requestId` | `string` | Request identifier for the font load call. |
| <a id="property-familyname"></a> `familyName` | `string` \| `null` | Font family name detected by the runner. |
| <a id="property-characters"></a> `characters` | `string`[] | Characters available in the loaded font. |
