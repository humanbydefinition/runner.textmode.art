---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / ParentToRunnerMessage

# Type Alias: ParentToRunnerMessage

```ts
type ParentToRunnerMessage = 
  | RunCodeMessage
  | SoftResetMessage
  | DisposeMessage
  | PingMessage;
```

Messages sent from a host app to the runner after handshake.
