---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / ExportMessage

# Interface: ExportMessage

Request to export the current runner output.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"EXPORT"` | - |
| <a id="property-requestid"></a> `requestId` | `string` | Request identifier for result routing. |
| <a id="property-format"></a> `format` | `"image"` \| `"svg"` \| `"txt"` \| `"gif"` \| `"webm"` | Requested export format. |
| <a id="property-options"></a> `options?` | \| [`ImageExportOptions`](ImageExportOptions.md) \| [`SvgExportOptions`](SvgExportOptions.md) \| [`TxtExportOptions`](TxtExportOptions.md) \| [`GifExportOptions`](GifExportOptions.md) \| [`WebmExportOptions`](WebmExportOptions.md) | Export options matching the requested format. |
