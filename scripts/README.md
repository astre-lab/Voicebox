# Isolated build pipeline

This pipeline does not use or modify the existing `justfile`.

The important design rule is:

> The pipeline does not guess the framework or build output.

Each application declares three things in `build/config.mjs`:

1. the existing `pnpm run build:*` command;
2. the exact artifact that command produces;
3. the runtime used when turning that artifact into a Docker image.

## Commands

```bash
node build/build.mjs landing
node build/build.mjs web
node build/build.mjs docs
node build/build.mjs all
```

Docker/release:

```bash
RELEASE_VERSION=1.0.0 node build/build.mjs all --docker
```

## Output

```text
builds/
├── landing/
│   ├── build.json
│   ├── output/
│   └── image/
│       └── landing-1.0.0.tar
├── web/
│   ├── build.json
│   ├── output/
│   └── image/
│       └── web-1.0.0.tar
├── docs/
│   ├── build.json
│   ├── output/
│   └── image/
│       └── docs-1.0.0.tar
└── release.json
```

## Runtime types

Supported runtimes are:

- `static`
- `next`
- `node`
- `deno`

A Svelte/Vite static build can therefore use `static` without changing the
pipeline itself.

A Next.js application can use `next`, but only when its configured output
really is a Next standalone server.

## Important

The sample `config.mjs` currently uses `dist` for the targets because your
`web` build emitted Vite/Rollup output. Verify the actual output directories
for each application before running `all --docker`.

If an application does not produce `dist`, change only its `output.path`.

The pipeline will fail loudly instead of silently copying the wrong artifact.
