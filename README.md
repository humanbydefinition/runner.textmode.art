# runner.textmode.art

<div align="center">

<img alt="runner.textmode.art — sandboxed textmode runtime" src=".github/assets/readme-og.png" />

| [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/) | [![docs](https://img.shields.io/badge/docs-vitepress-646cff?logo=vitepress&logoColor=white)](https://code.textmode.art/) [![Discord](https://img.shields.io/discord/1357070706181017691?color=5865F2&label=Discord&logo=discord&logoColor=white)](https://discord.gg/sjrw8QXNks) | [![ko-fi](https://shields.io/badge/ko--fi-donate-ff5f5f?logo=ko-fi)](https://ko-fi.com/V7V8JG2FY) [![GitHub-sponsors](https://img.shields.io/badge/sponsor-30363D?logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/humanbydefinition) |
|:-------------|:-------------|:-------------|

</div>

`runner.textmode.art` is the sandboxed iframe runtime for
[`textmode.js`](https://github.com/humanbydefinition/textmode.js). This monorepo
hosts the runner app served at [runner.textmode.art](https://runner.textmode.art/)
alongside the browser packages host apps use to embed it: the
[`runner-client`](./packages/runner-client) iframe client and the
[`runner-protocol`](./packages/runner-protocol) wire contract.

Host apps like [editor.textmode.art](https://editor.textmode.art/) mount the
runner to execute user sketches in an isolated browser context, away from the
host document. Inside the sandbox, the runner boots a `textmode.js` rendering
environment with the textmode plugin stack - synth, figlet, filters, and export -
and talks to its host through a small typed message protocol with capability
negotiation, heartbeats, and in-place runtime resets.

## Workspaces

| Workspace | Purpose | License |
|:--|:--|:--|
| [`apps/runner`](./apps/runner) | Hosted Vite app deployed to [runner.textmode.art](https://runner.textmode.art). | AGPL-3.0 |
| [`packages/runner-protocol`](./packages/runner-protocol) | Shared wire protocol types, capabilities, and runtime validators. | CC0-1.0 |
| [`packages/runner-client`](./packages/runner-client) | Browser iframe client used by host apps to mount, run, reconnect, and dispose the runner. | AGPL-3.0 |

Public package imports are root-only:

```ts
import { IframeTextmodeRuntime } from '@textmode/runner-client';
import { isRunnerMessage } from '@textmode/runner-protocol';
```

## Development

Install dependencies from the monorepo root:

```sh
npm install
```

Start the runner app:

```sh
npm run dev
```

Run the full workspace checks:

```sh
npm run check-types
npm run lint
npm run test
npm run build
```

Generate package API documentation:

```sh
npm run build:docs
```

## Deployment

GitHub Pages deployment is handled by [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

The workflow:

- installs workspace dependencies with `npm ci`
- builds protocol, client, and runner workspaces with `npm run build`
- sets `VITE_RUNNER_PARENT_ORIGINS` for production host apps
- uploads `apps/runner/dist` as the Pages artifact

The runner app has its own deployment and environment notes in [`apps/runner/README.md`](./apps/runner/README.md).

## Package Releases

`@textmode/runner-protocol` and `@textmode/runner-client` are published from this monorepo.

Before publishing either package, verify the tarball contents:

```sh
npm pack --dry-run -w @textmode/runner-protocol
npm pack --dry-run -w @textmode/runner-client
```

Publish public scoped packages with:

```sh
npm publish --access public -w @textmode/runner-protocol
npm publish --access public -w @textmode/runner-client
```

Publish `@textmode/runner-protocol` before `@textmode/runner-client` when releasing matching first-party versions, because the client depends on the protocol package.

## License

This monorepo contains packages with different licenses:

- [`apps/runner`](./apps/runner/LICENSE): AGPL-3.0
- [`packages/runner-client`](./packages/runner-client/LICENSE): AGPL-3.0
- [`packages/runner-protocol`](./packages/runner-protocol/LICENSE): CC0-1.0

The root [`LICENSE`](./LICENSE) covers the AGPL-licensed parts of the repository.

### Acknowledgements

This project targets the [`textmode.js`](https://github.com/humanbydefinition/textmode.js) sketch API.

AGPL-licensed dependency acknowledgement:

- **[textmode.synth.js](https://github.com/humanbydefinition/textmode.synth.js)** - AGPL-3.0
