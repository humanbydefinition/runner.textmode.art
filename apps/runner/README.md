# @textmode/runner-app

Hosted sandbox runner app for textmode browser hosts.

The runner is served from [runner.textmode.art](https://runner.textmode.art) and is meant to be embedded as an iframe by trusted host apps such as [synth.textmode.art](https://synth.textmode.art) and [editor.textmode.art](https://editor.textmode.art). It executes user sketches away from the host document, manages a `textmode.js` runtime, and communicates with the parent app through `@textmode/runner-protocol`.

## Runtime Behavior

- Accepts the generic runner handshake from allowed parent origins.
- Establishes a `MessagePort` transport after `INIT`.
- Reports runner capabilities through `READY`.
- Runs sketch code, soft resets, runtime configuration, settings updates, exports, font loading, playback control, heartbeat pings, UI toggle events, and user interaction events.
- Redirects top-level production visits back to the configured parent app while still allowing local debug access with `?debug`.

## Development

Install dependencies from the monorepo root:

```sh
npm install
```

Start the runner app from the monorepo root:

```sh
npm run dev
```

Or run workspace commands directly:

```sh
npm run dev -w @textmode/runner-app
npm run build -w @textmode/runner-app
npm run check-types -w @textmode/runner-app
npm run lint -w @textmode/runner-app
npm run test -w @textmode/runner-app
```

The dev server uses port `5181`.

## Environment

The Vite config reads environment files from the monorepo root.

| Variable | Purpose |
|:--|:--|
| `VITE_RUNNER_PARENT_ORIGINS` | Comma-separated list of allowed parent origins. Defaults to `*` in development and an empty list in production when unset. |
| `VITE_RUNNER_FALLBACK_URL` | Production fallback URL for top-level redirects when no allowed parent origin is configured. |

Example production origins:

```sh
VITE_RUNNER_PARENT_ORIGINS=https://synth.textmode.art,https://editor.textmode.art
VITE_RUNNER_FALLBACK_URL=https://synth.textmode.art
```

## Deployment

The root GitHub Pages workflow builds the full monorepo and uploads this app's build output from:

```txt
apps/runner/dist
```

The app includes [`public/CNAME`](./public/CNAME), which is copied into `dist` during the Vite build so GitHub Pages keeps serving the custom domain.

## License

AGPL-3.0-or-later. See [LICENSE](./LICENSE).
