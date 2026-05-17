---
layout: doc
editLink: true
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
