# runner.textmode.art packages

The npm workspace packages for the [`textmode.js`](https://github.com/humanbydefinition/textmode.js)
ecosystem runner. Each package is small and focused so host apps can adopt the
pieces they need without copying integration code between projects.

## Packages

| Package                                              | Purpose                                                                        | License    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ | ---------- |
| [`@textmode/runner-protocol`](./runner-protocol/README.md) | Shared wire protocol types, capabilities, and runtime validators           | CC0-1.0    |
| [`@textmode/runner-client`](./runner-client/README.md)     | Browser iframe client used by host apps to mount, run, reconnect, and dispose the runner | AGPL-3.0 |

## Development

Install dependencies from the monorepo root:

```sh
npm install
```

Run the workspace checks:

```sh
npm run check
```

## License

The `runner.textmode.art` packages are published under the licenses declared in
their [`package.json`](../package.json) files.
