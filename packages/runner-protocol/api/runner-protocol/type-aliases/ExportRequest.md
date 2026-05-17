---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / ExportRequest

# Type Alias: ExportRequest

```ts
type ExportRequest = 
  | {
  format: "image";
  options?: ImageExportOptions;
}
  | {
  format: "svg";
  options?: SvgExportOptions;
}
  | {
  format: "txt";
  options?: TxtExportOptions;
}
  | {
  format: "gif";
  options?: GifExportOptions;
}
  | {
  format: "webm";
  options?: WebmExportOptions;
};
```

Typed export request payload grouped by export format.
