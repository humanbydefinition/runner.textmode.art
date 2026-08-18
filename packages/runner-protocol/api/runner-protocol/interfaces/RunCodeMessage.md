---
layout: doc
editLink: false
title: RunCodeMessage
description: Request to execute code in the runner.
category: Interfaces
api: true
kind: Interface
lastModified: 2026-08-18
isInterface: true
---

[@textmode/runner-protocol](../index.md) / RunCodeMessage

# Interface: RunCodeMessage

Request to execute code in the runner.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-code"></a> `code` | `string` | Source code to execute. |
| <a id="property-requestid"></a> `requestId?` | `string` | Optional request identifier for result routing. |
| <a id="property-type"></a> `type` | `"RUN_CODE"` | - |
