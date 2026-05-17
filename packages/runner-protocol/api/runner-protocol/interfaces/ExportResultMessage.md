---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / ExportResultMessage

# Interface: ExportResultMessage

Export completion payload.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"EXPORT_RESULT"` | - |
| <a id="property-requestid"></a> `requestId` | `string` | Request identifier for the export call. |
| <a id="property-format"></a> `format` | `"image"` \| `"svg"` \| `"txt"` \| `"gif"` \| `"webm"` | Completed export format. |
| <a id="property-blob"></a> `blob?` | `Blob` | Binary export result for blob-based formats. |
| <a id="property-text"></a> `text?` | `string` | Text export result for text-based formats. |
| <a id="property-filename"></a> `filename?` | `string` | Suggested filename, when provided by the runner. |
| <a id="property-mimetype"></a> `mimeType?` | `string` | MIME type for the export result. |
