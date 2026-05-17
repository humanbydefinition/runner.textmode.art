---
layout: doc
editLink: true
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
| [EXPORT\_FORMATS](variables/EXPORT_FORMATS.md) | Export families supported by the current runner. |
| [ExportFormat](type-aliases/ExportFormat.md) | Export format advertised by runner capabilities and export messages. |
| [RunnerCapabilities](interfaces/RunnerCapabilities.md) | Feature flags advertised by a ready runner iframe. |
| [createRunnerCapabilities](functions/createRunnerCapabilities.md) | Creates the capability set for the current hosted runner implementation. |

## Exports

| Name | Description |
| ------ | ------ |
| [ImageExportFormat](type-aliases/ImageExportFormat.md) | Raster image export file format. |
| [ImageExportOptions](interfaces/ImageExportOptions.md) | Options for raster image exports. |
| [SvgExportOptions](interfaces/SvgExportOptions.md) | Options for SVG exports. |
| [TxtExportOptions](interfaces/TxtExportOptions.md) | Options for plain text exports. |
| [GifExportOptions](interfaces/GifExportOptions.md) | Options for animated GIF exports. |
| [WebmExportOptions](interfaces/WebmExportOptions.md) | Options for WebM exports. |
| [ExportRequest](type-aliases/ExportRequest.md) | Typed export request payload grouped by export format. |
| [ExportProgress](interfaces/ExportProgress.md) | Progress payload emitted while recording multi-frame exports. |

## Guards

| Function | Description |
| ------ | ------ |
| [isRunnerMessage](functions/isRunnerMessage.md) | Checks whether a value is a valid current runner-to-host message. |
| [isParentMessage](functions/isParentMessage.md) | Checks whether a value is a valid current host-to-runner MessagePort message. |
| [isInitMessage](functions/isInitMessage.md) | Checks whether a value is a valid current runner iframe initialization message. |
| [isRunnerCapabilities](functions/isRunnerCapabilities.md) | Checks whether a value is a valid current runner capability set. |

## Messages

| Name | Description |
| ------ | ------ |
| [InitMessage](interfaces/InitMessage.md) | Initial window message sent by a host app to the runner iframe. |
| [ReadyMessage](interfaces/ReadyMessage.md) | Runner readiness message sent after a successful iframe handshake. |
| [RunOkMessage](interfaces/RunOkMessage.md) | Successful code execution result. |
| [RunErrorMessage](interfaces/RunErrorMessage.md) | Code execution failure result. |
| [SynthErrorMessage](interfaces/SynthErrorMessage.md) | Shader synth parameter error reported by the runner. |
| [ToggleUIMessage](interfaces/ToggleUIMessage.md) | Runner-originated shortcut event requesting host UI visibility changes. |
| [UserInteractionMessage](interfaces/UserInteractionMessage.md) | Runner-originated user interaction event. |
| [ExportResultMessage](interfaces/ExportResultMessage.md) | Export completion payload. |
| [ExportProgressMessage](interfaces/ExportProgressMessage.md) | Progress payload for multi-frame exports. |
| [FontLoadedMessage](interfaces/FontLoadedMessage.md) | Successful font load result. |
| [FontErrorMessage](interfaces/FontErrorMessage.md) | Font load failure result. |
| [PlaybackStateMessage](interfaces/PlaybackStateMessage.md) | Playback state response or event. |
| [PongMessage](interfaces/PongMessage.md) | Heartbeat response from the runner. |
| [RunnerToParentMessage](type-aliases/RunnerToParentMessage.md) | Messages sent from the runner iframe to a host app. |
| [RunCodeMessage](interfaces/RunCodeMessage.md) | Request to execute code in the runner. |
| [SoftResetMessage](interfaces/SoftResetMessage.md) | Request to reset frame state and execute code. |
| [DisposeMessage](interfaces/DisposeMessage.md) | Request to dispose the runner runtime. |
| [ConfigureRuntimeMessage](interfaces/ConfigureRuntimeMessage.md) | Request to initialize or reconfigure fixed runtime settings. |
| [SetSettingsMessage](interfaces/SetSettingsMessage.md) | Request to update part of the current runtime settings. |
| [ExportMessage](interfaces/ExportMessage.md) | Request to export the current runner output. |
| [LoadFontMessage](interfaces/LoadFontMessage.md) | Request to load a font file into the runner. |
| [PlaybackMessage](interfaces/PlaybackMessage.md) | Request to control or inspect playback. |
| [PingMessage](interfaces/PingMessage.md) | Heartbeat request sent by a host app. |
| [ParentToRunnerMessage](type-aliases/ParentToRunnerMessage.md) | Messages sent from a host app to the runner after handshake. |
| [WindowToRunnerMessage](type-aliases/WindowToRunnerMessage.md) | Messages sent to the runner iframe window before MessagePort attachment. |
| [Message](type-aliases/Message.md) | Any message in the runner protocol. |

## Playback

| Name | Description |
| ------ | ------ |
| [PlaybackAction](type-aliases/PlaybackAction.md) | Playback command accepted by the runner. |
| [PlaybackState](interfaces/PlaybackState.md) | Playback state snapshot emitted by the runner. |

## Runtime

| Interface | Description |
| ------ | ------ |
| [RuntimeSettings](interfaces/RuntimeSettings.md) | Fixed runtime dimensions and timing used by configurable runner hosts. |
