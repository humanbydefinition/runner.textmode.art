---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / ExportProgress

# Interface: ExportProgress

Progress payload emitted while recording multi-frame exports.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-state"></a> `state` | `string` | Export lifecycle state reported by the runner. |
| <a id="property-frameindex"></a> `frameIndex?` | `number` | Zero-based frame currently being recorded, when applicable. |
| <a id="property-totalframes"></a> `totalFrames?` | `number` | Total frame count for the export, when known. |
| <a id="property-message"></a> `message?` | `string` | Optional human-readable progress detail. |
