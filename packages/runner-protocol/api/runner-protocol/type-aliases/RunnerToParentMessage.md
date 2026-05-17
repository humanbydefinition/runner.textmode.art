---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / RunnerToParentMessage

# Type Alias: RunnerToParentMessage

```ts
type RunnerToParentMessage = 
  | ReadyMessage
  | RunOkMessage
  | RunErrorMessage
  | SynthErrorMessage
  | ToggleUIMessage
  | UserInteractionMessage
  | ExportResultMessage
  | ExportProgressMessage
  | FontLoadedMessage
  | FontErrorMessage
  | PlaybackStateMessage
  | PongMessage;
```

Messages sent from the runner iframe to a host app.
