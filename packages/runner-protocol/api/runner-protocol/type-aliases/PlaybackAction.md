---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / PlaybackAction

# Type Alias: PlaybackAction

```ts
type PlaybackAction = 
  | "play"
  | "pause"
  | "stop"
  | "seek"
  | "next"
  | "previous"
  | "setMaxFrames"
  | "state";
```

Playback command accepted by the runner.
