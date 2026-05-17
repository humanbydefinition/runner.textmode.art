---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / PlaybackMessage

# Interface: PlaybackMessage

Request to control or inspect playback.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"PLAYBACK"` | - |
| <a id="property-requestid"></a> `requestId?` | `string` | Optional request identifier for result routing. |
| <a id="property-action"></a> `action` | [`PlaybackAction`](../type-aliases/PlaybackAction.md) | Playback action to perform. |
| <a id="property-frame"></a> `frame?` | `number` | Target frame for seek-like actions. |
| <a id="property-maxframes"></a> `maxFrames?` | `number` | Maximum frame count for playback range updates. |
