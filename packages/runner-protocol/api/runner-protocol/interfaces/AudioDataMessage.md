---
layout: doc
editLink: false
title: AudioDataMessage
description: Fire-and-forget audio analysis frame sent by a host app.
category: Interfaces
api: true
kind: Interface
lastModified: 2026-08-18
isInterface: true
---

[@textmode/runner-protocol](../index.md) / AudioDataMessage

# Interface: AudioDataMessage

Fire-and-forget audio analysis frame sent by a host app.

Values use the Web Audio byte analyser convention:
frequency bins and waveform samples are integers in the 0-255 range.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-fft"></a> `fft` | `Uint8Array` | Frequency-domain FFT data. |
| <a id="property-timestamp"></a> `timestamp` | `number` | Host-side capture timestamp. |
| <a id="property-type"></a> `type` | `"AUDIO_DATA"` | - |
| <a id="property-waveform"></a> `waveform` | `Uint8Array` | Time-domain waveform data. |
