---
layout: doc
editLink: false
title: DEFAULT_IFRAME_SANDBOX_TOKENS
description: Default sandbox tokens used by the runner iframe.
category: Variables
api: true
kind: Variable
lastModified: 2026-08-18
---

[@textmode/runner-client](../index.md) / DEFAULT\_IFRAME\_SANDBOX\_TOKENS

# Variable: DEFAULT\_IFRAME\_SANDBOX\_TOKENS

```ts
const DEFAULT_IFRAME_SANDBOX_TOKENS: readonly IframeSandboxToken[];
```

Default sandbox tokens used by the runner iframe.

The default deliberately excludes `allow-downloads`; downloads should be
initiated by the host app after receiving export results.
