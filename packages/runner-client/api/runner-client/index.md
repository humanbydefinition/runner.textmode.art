---
layout: doc
editLink: false
title: "@textmode/runner-client"
description: Browser iframe runtime client for the hosted textmode runner.
category: API Reference
api: true
kind: Project
lastModified: 2026-08-18
---

# @textmode/runner-client

Browser iframe runtime client for the hosted textmode runner.

`@textmode/runner-client` manages the runner iframe lifecycle, current
protocol handshake, request/response routing, heartbeat monitoring, reconnect,
and disposal for host apps.

## Errors

| Name | Description |
| ------ | ------ |
| [RunnerRequestError](classes/RunnerRequestError.md) | Error used when a request-scoped runner execution fails. |
| [RunnerExecutionError](interfaces/RunnerExecutionError.md) | Error shape surfaced by runner execution callbacks and rejected run requests. |

## Options

| Name | Description |
| ------ | ------ |
| [IframeTextmodeRuntimeOptions](interfaces/IframeTextmodeRuntimeOptions.md) | Options for [IframeTextmodeRuntime](classes/IframeTextmodeRuntime.md). |
| [RunnerReconnectOptions](interfaces/RunnerReconnectOptions.md) | Controls how a runner reconnect restores previously requested code. |
| [IframeMountMode](type-aliases/IframeMountMode.md) | How the runner iframe should be mounted into its container. |
| [IframeSandboxToken](type-aliases/IframeSandboxToken.md) | Iframe sandbox token supported by the runner client. |
| [DEFAULT\_IFRAME\_SANDBOX\_TOKENS](variables/DEFAULT_IFRAME_SANDBOX_TOKENS.md) | Default sandbox tokens used by the runner iframe. |

## Other

| Interface | Description |
| ------ | ------ |
| [RunnerProbeOptions](interfaces/RunnerProbeOptions.md) | Controls a transactional code probe. |

## Runtime

| Name | Description |
| ------ | ------ |
| [IframeTextmodeRuntime](classes/IframeTextmodeRuntime.md) | Browser iframe runtime for communicating with the hosted textmode runner. |
| [RunnerRuntimeStatus](type-aliases/RunnerRuntimeStatus.md) | Lifecycle state for an iframe runner connection. |
