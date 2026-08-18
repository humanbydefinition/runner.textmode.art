---
layout: doc
editLink: false
title: RunnerToParentMessage
description: Messages sent from the runner iframe to a host app.
category: Type Aliases
api: true
kind: TypeAlias
lastModified: 2026-08-18
---

[@textmode/runner-protocol](../index.md) / RunnerToParentMessage

# Type Alias: RunnerToParentMessage

```ts
type RunnerToParentMessage = 
  | ReadyMessage
  | RunOkMessage
  | RunErrorMessage
  | SynthErrorMessage
  | HardResetMessage
  | ToggleUIMessage
  | UserActivationRequiredMessage
  | UserInteractionMessage
  | PongMessage;
```

Messages sent from the runner iframe to a host app.
