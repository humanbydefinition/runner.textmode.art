---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / PlaybackState

# Interface: PlaybackState

Playback state snapshot emitted by the runner.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-isplaying"></a> `isPlaying` | `boolean` | Whether playback is actively advancing frames. |
| <a id="property-frame"></a> `frame` | `number` | Current frame index. |
| <a id="property-maxframes"></a> `maxFrames` | `number` | Maximum frame count used by playback controls. |
| <a id="property-fps"></a> `fps?` | `number` | Optional measured or configured frames per second. |
