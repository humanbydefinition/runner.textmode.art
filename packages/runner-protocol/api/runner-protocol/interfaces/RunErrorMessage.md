---
layout: doc
editLink: false
title: RunErrorMessage
description: Code execution failure result.
category: Interfaces
api: true
kind: Interface
lastModified: 2026-08-18
isInterface: true
---

[@textmode/runner-protocol](../index.md) / RunErrorMessage

# Interface: RunErrorMessage

Code execution failure result.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-column"></a> `column?` | `number` | Optional 1-based source column. |
| <a id="property-line"></a> `line?` | `number` | Optional 1-based source line. |
| <a id="property-message"></a> `message` | `string` | Human-readable error message. |
| <a id="property-requestid"></a> `requestId?` | `string` | Request identifier when the failure belongs to a request/response call. |
| <a id="property-stack"></a> `stack?` | `string` | Optional stack trace. |
| <a id="property-type"></a> `type` | `"RUN_ERROR"` | - |
