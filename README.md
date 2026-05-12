# runner.textmode.art

Static sandbox iframe runner for `synth.textmode.art`.

## Development

```bash
npm install
npm run dev
```

The runner accepts parent origins through `VITE_RUNNER_PARENT_ORIGINS`.

## GitHub Pages

The included workflow builds `dist` and deploys it to GitHub Pages. Configure Pages to use GitHub Actions, and keep `public/CNAME` if deploying to `runner.textmode.art`.
