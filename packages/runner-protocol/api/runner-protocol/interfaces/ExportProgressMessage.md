---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / ExportProgressMessage

# Interface: ExportProgressMessage

Progress payload for multi-frame exports.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"EXPORT_PROGRESS"` | - |
| <a id="property-requestid"></a> `requestId` | `string` | Request identifier for the export call. |
| <a id="property-format"></a> `format` | `"gif"` \| `"webm"` | Streaming export format. |
| <a id="property-progress"></a> `progress` | [`ExportProgress`](ExportProgress.md) | Current progress snapshot. |
