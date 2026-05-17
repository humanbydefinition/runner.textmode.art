---
layout: doc
editLink: true
---

[@textmode/runner-client](../index.md) / DEFAULT\_IFRAME\_SANDBOX\_TOKENS

# Variable: DEFAULT\_IFRAME\_SANDBOX\_TOKENS

```ts
const DEFAULT_IFRAME_SANDBOX_TOKENS: readonly IframeSandboxToken[];
```

Default sandbox tokens used by the runner iframe.

The default deliberately excludes `allow-downloads`; downloads should be
initiated by the host app after receiving export results.
