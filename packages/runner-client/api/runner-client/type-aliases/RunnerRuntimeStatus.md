---
layout: doc
editLink: false
title: RunnerRuntimeStatus
description: Lifecycle state for an iframe runner connection.
category: Type Aliases
api: true
kind: TypeAlias
lastModified: 2026-08-18
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
