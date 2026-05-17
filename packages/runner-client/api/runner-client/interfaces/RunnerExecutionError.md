---
layout: doc
editLink: true
---

[@textmode/runner-client](../index.md) / RunnerExecutionError

# Interface: RunnerExecutionError

Error shape surfaced by runner execution callbacks and rejected run requests.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-message"></a> `message` | `string` | Human-readable error message. |
| <a id="property-stack"></a> `stack?` | `string` | Optional stack trace reported by the runner. |
| <a id="property-line"></a> `line?` | `number` | Optional 1-based source line. |
| <a id="property-column"></a> `column?` | `number` | Optional 1-based source column. |
