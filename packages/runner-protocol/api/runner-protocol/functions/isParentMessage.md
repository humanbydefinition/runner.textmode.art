---
layout: doc
editLink: false
title: isParentMessage
description: Checks whether a value is a valid current host-to-runner MessagePort message.
category: Functions
api: true
kind: Function
lastModified: 2026-08-18
---

[@textmode/runner-protocol](../index.md) / isParentMessage

# Function: isParentMessage()

```ts
function isParentMessage(msg): msg is ParentToRunnerMessage;
```

Checks whether a value is a valid current host-to-runner MessagePort message.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `msg` | `unknown` |

## Returns

`msg is ParentToRunnerMessage`
