---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / PlaybackStateMessage

# Interface: PlaybackStateMessage

Playback state response or event.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"PLAYBACK_STATE"` | - |
| <a id="property-requestid"></a> `requestId?` | `string` | Request identifier when the state belongs to a playback request. |
| <a id="property-state"></a> `state` | [`PlaybackState`](PlaybackState.md) | Current playback state. |
