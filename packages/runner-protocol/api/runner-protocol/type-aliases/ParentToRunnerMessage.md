---
layout: doc
editLink: false
title: ParentToRunnerMessage
description: Messages sent from a host app to the runner after handshake.
category: Type Aliases
api: true
kind: TypeAlias
lastModified: 2026-08-18
---

[@textmode/runner-protocol](../index.md) / ParentToRunnerMessage

# Type Alias: ParentToRunnerMessage

```ts
type ParentToRunnerMessage = 
  | RunCodeMessage
  | ResetRuntimeMessage
  | DisposeMessage
  | PingMessage
  | AudioDataMessage;
```

Messages sent from a host app to the runner after handshake.
