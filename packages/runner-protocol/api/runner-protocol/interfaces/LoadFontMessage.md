---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / LoadFontMessage

# Interface: LoadFontMessage

Request to load a font file into the runner.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"LOAD_FONT"` | - |
| <a id="property-requestid"></a> `requestId` | `string` | Request identifier for result routing. |
| <a id="property-filename"></a> `fileName` | `string` | Original file name. |
| <a id="property-mimetype"></a> `mimeType?` | `string` | Browser-reported MIME type, when available. |
| <a id="property-buffer"></a> `buffer` | `ArrayBuffer` | Font file bytes. |
