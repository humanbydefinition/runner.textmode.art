---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / SynthErrorMessage

# Interface: SynthErrorMessage

Shader synth parameter error reported by the runner.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"SYNTH_ERROR"` | - |
| <a id="property-message"></a> `message` | `string` | Human-readable error message. |
| <a id="property-uniformname"></a> `uniformName?` | `string` | Uniform name associated with the error, when available. |
