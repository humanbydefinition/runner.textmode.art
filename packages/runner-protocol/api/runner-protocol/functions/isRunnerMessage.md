---
layout: doc
editLink: true
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
