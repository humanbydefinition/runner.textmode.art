---
layout: doc
editLink: false
title: RunnerExecutionError
description: Error shape surfaced by runner execution callbacks and rejected run requests.
category: Interfaces
api: true
kind: Interface
lastModified: 2026-08-18
isInterface: true
---

[@textmode/runner-client](../index.md) / RunnerExecutionError

# Interface: RunnerExecutionError

Error shape surfaced by runner execution callbacks and rejected run requests.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-column"></a> `column?` | `number` | Optional 1-based source column. |
| <a id="property-line"></a> `line?` | `number` | Optional 1-based source line. |
| <a id="property-message"></a> `message` | `string` | Human-readable error message. |
| <a id="property-stack"></a> `stack?` | `string` | Optional stack trace reported by the runner. |
