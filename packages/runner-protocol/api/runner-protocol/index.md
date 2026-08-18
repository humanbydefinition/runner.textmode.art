---
layout: doc
editLink: false
title: "@textmode/runner-protocol"
description: Shared message protocol and validators for the hosted textmode runner iframe.
category: API Reference
api: true
kind: Project
lastModified: 2026-08-18
---

# @textmode/runner-protocol

Shared message protocol for the textmode runner iframe.

`@textmode/runner-protocol` is the single source of truth for the wire
contract used by the hosted runner and browser host apps.
Runtime protocol version negotiation is intentionally absent: package semver
describes source compatibility, while this package describes the one current
message shape. Feature availability is advertised through capabilities.

## Capabilities

| Name | Description |
| ------ | ------ |
| [RunnerCapabilities](interfaces/RunnerCapabilities.md) | Feature flags advertised by a ready runner iframe. |
| [createRunnerCapabilities](functions/createRunnerCapabilities.md) | Creates the capability set for the current hosted runner implementation. |

## Guards

| Function | Description |
| ------ | ------ |
| [isInitMessage](functions/isInitMessage.md) | Checks whether a value is a valid current runner iframe initialization message. |
| [isParentMessage](functions/isParentMessage.md) | Checks whether a value is a valid current host-to-runner MessagePort message. |
| [isRunnerCapabilities](functions/isRunnerCapabilities.md) | Checks whether a value is a valid current runner capability set. |
| [isRunnerMessage](functions/isRunnerMessage.md) | Checks whether a value is a valid current runner-to-host message. |

## Messages

| Name | Description |
| ------ | ------ |
| [AudioDataMessage](interfaces/AudioDataMessage.md) | Fire-and-forget audio analysis frame sent by a host app. |
| [DisposeMessage](interfaces/DisposeMessage.md) | Request to dispose the runner runtime. |
| [HardResetMessage](interfaces/HardResetMessage.md) | Runner-originated shortcut event requesting a fresh host runtime. |
| [InitMessage](interfaces/InitMessage.md) | Initial window message sent by a host app to the runner iframe. |
| [PingMessage](interfaces/PingMessage.md) | Heartbeat request sent by a host app. |
| [PongMessage](interfaces/PongMessage.md) | Heartbeat response from the runner. |
| [ReadyMessage](interfaces/ReadyMessage.md) | Runner readiness message sent after a successful iframe handshake. |
| [ResetRuntimeMessage](interfaces/ResetRuntimeMessage.md) | Request to rebuild the textmode runtime inside the existing iframe document. |
| [RunCodeMessage](interfaces/RunCodeMessage.md) | Request to execute code in the runner. |
| [RunErrorMessage](interfaces/RunErrorMessage.md) | Code execution failure result. |
| [RunOkMessage](interfaces/RunOkMessage.md) | Successful code execution result. |
| [SynthErrorMessage](interfaces/SynthErrorMessage.md) | Shader synth parameter error reported by the runner. |
| [ToggleUIMessage](interfaces/ToggleUIMessage.md) | Runner-originated shortcut event requesting host UI visibility changes. |
| [UserActivationRequiredMessage](interfaces/UserActivationRequiredMessage.md) | Runner request for a trusted interaction inside its cross-origin document. |
| [UserInteractionMessage](interfaces/UserInteractionMessage.md) | Runner-originated user interaction event. |
| [Message](type-aliases/Message.md) | Any message in the runner protocol. |
| [ParentToRunnerMessage](type-aliases/ParentToRunnerMessage.md) | Messages sent from a host app to the runner after handshake. |
| [RunnerToParentMessage](type-aliases/RunnerToParentMessage.md) | Messages sent from the runner iframe to a host app. |
| [WindowToRunnerMessage](type-aliases/WindowToRunnerMessage.md) | Messages sent to the runner iframe window before MessagePort attachment. |
