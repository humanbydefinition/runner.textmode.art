---
layout: doc
editLink: false
title: SynthErrorMessage
description: Shader synth parameter error reported by the runner.
category: Interfaces
api: true
kind: Interface
lastModified: 2026-08-18
isInterface: true
---

[@textmode/runner-protocol](../index.md) / SynthErrorMessage

# Interface: SynthErrorMessage

Shader synth parameter error reported by the runner.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-message"></a> `message` | `string` | Human-readable error message. |
| <a id="property-type"></a> `type` | `"SYNTH_ERROR"` | - |
| <a id="property-uniformname"></a> `uniformName?` | `string` | Uniform name associated with the error, when available. |
