---
layout: doc
editLink: false
title: isRunnerMessage
description: Checks whether a value is a valid current runner-to-host message.
category: Functions
api: true
kind: Function
lastModified: 2026-08-18
---

[@textmode/runner-protocol](../index.md) / isRunnerMessage

# Function: isRunnerMessage()

```ts
function isRunnerMessage(msg): msg is RunnerToParentMessage;
```

Checks whether a value is a valid current runner-to-host message.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `msg` | `unknown` |

## Returns

`msg is RunnerToParentMessage`
