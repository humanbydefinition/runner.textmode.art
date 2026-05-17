---
layout: doc
editLink: true
---

[@textmode/runner-client](../index.md) / RunnerRuntimeStatus

# Type Alias: RunnerRuntimeStatus

```ts
type RunnerRuntimeStatus = 
  | "idle"
  | "connecting"
  | "configuring"
  | "ready"
  | "recovering"
  | "unavailable"
  | "hung";
```

Lifecycle state for an iframe runner connection.
