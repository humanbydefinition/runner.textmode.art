# rastergang.textmode.art

<div align="center">

| [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/) | [![Discord](https://img.shields.io/discord/1357070706181017691?color=5865F2&label=Discord&logo=discord&logoColor=white)](https://discord.gg/sjrw8QXNks) | [![ko-fi](https://shields.io/badge/ko--fi-donate-ff5f5f?logo=ko-fi)](https://ko-fi.com/V7V8JG2FY) [![Github-sponsors](https://img.shields.io/badge/sponsor-30363D?logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/humanbydefinition) |
|:-------------|:-------------|:-------------|

</div>

> [!IMPORTANT]
> **Work in progress**: This project is currently in active development. Runtime behavior and integration details are subject to change.

`rastergang.textmode.art` is a browser-based sandbox runner for [`synth.textmode.art`](https://synth.textmode.art). It runs user sketches inside an isolated iframe, boots a `textmode.js` rendering context, and communicates execution state back to the parent editor over a small message protocol.

## Features

- **Sandboxed execution**: Runs sketches inside a dedicated iframe instead of directly in the editor page.
- **Parent/runner handshake**: Accepts initialization only from allowed parent origins and establishes a `MessagePort` for communication.
- **Textmode runtime**: Creates a full-screen `textmode.js` instance with `textmode.synth.js` and `textmode.filters.js` plugins enabled.
- **Sketch lifecycle control**: Supports code execution, soft resets, teardown, resize handling, and runtime error reporting.
- **Top-level guardrails**: Redirects top-level visits back to the editor in production while still allowing direct debug access during local development.

## Getting started

This app is intended to be embedded by **[synth.textmode.art](https://synth.textmode.art)**.

For the production deployment, the iframe is served from **[rastergang.textmode.art](https://rastergang.textmode.art)**.

## Development

To run the project locally:

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Additional checks:

```bash
npm run check-types
npm run lint
npm run test
```

Environment variables:

- `VITE_RUNNER_PARENT_ORIGINS`: Comma-separated list of allowed parent origins. Defaults to `*` in development and an empty list in production when unset.
- `VITE_BASE_PATH`: Optional base path for repository-path GitHub Pages deployments.

The example configuration in `.env.example` allows `https://synth.textmode.art` as the production parent origin.

When opened directly in development, the runner allows top-level debugging with `?debug`; otherwise it redirects to the parent editor URL.

## License

This project is licensed under the **GNU Affero General Public License v3.0**.

### Acknowledgements

This project targets the [`textmode.js`](https://github.com/humanbydefinition/textmode.js) sketch API.

AGPL-licensed dependency acknowledgement:

- **[textmode.synth.js](https://github.com/humanbydefinition/textmode.synth.js)** - AGPL-3.0
