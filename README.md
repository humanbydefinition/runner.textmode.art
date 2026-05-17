# runner.textmode.art

<div align="center">

| [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/) | [![Discord](https://img.shields.io/discord/1357070706181017691?color=5865F2&label=Discord&logo=discord&logoColor=white)](https://discord.gg/sjrw8QXNks) | [![ko-fi](https://shields.io/badge/ko--fi-donate-ff5f5f?logo=ko-fi)](https://ko-fi.com/V7V8JG2FY) [![Github-sponsors](https://img.shields.io/badge/sponsor-30363D?logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/humanbydefinition) |
|:-------------|:-------------|:-------------|

</div>

Monorepo for the hosted textmode runner app and its shared browser integration packages.

`runner.textmode.art` is the sandboxed iframe runtime used by textmode host apps. It runs user sketches in an isolated browser context, boots a `textmode.js` rendering environment, and communicates with host apps through a small typed message protocol.

## Workspaces

| Workspace | Purpose | License |
|:--|:--|:--|
| [`apps/runner`](./apps/runner) | Hosted Vite app deployed to [runner.textmode.art](https://runner.textmode.art). | AGPL-3.0-or-later |
| [`packages/runner-protocol`](./packages/runner-protocol) | Shared wire protocol types, capabilities, and runtime validators. | CC0-1.0 |
| [`packages/runner-client`](./packages/runner-client) | Browser iframe client used by host apps to mount and control the runner. | AGPL-3.0-or-later |

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

- [`apps/runner`](./apps/runner/LICENSE): AGPL-3.0-or-later
- [`packages/runner-client`](./packages/runner-client/LICENSE): AGPL-3.0-or-later
- [`packages/runner-protocol`](./packages/runner-protocol/LICENSE): CC0-1.0

The root [`LICENSE`](./LICENSE) covers the AGPL-licensed parts of the repository.

### Acknowledgements

This project targets the [`textmode.js`](https://github.com/humanbydefinition/textmode.js) sketch API.

AGPL-licensed dependency acknowledgement:

- **[textmode.synth.js](https://github.com/humanbydefinition/textmode.synth.js)** - AGPL-3.0
