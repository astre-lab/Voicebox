#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  rmSync,
  cpSync,
  writeFileSync,
  statSync,
} from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { apps } from "./config.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BUILDS = join(ROOT, "builds");

const args = process.argv.slice(2);
const target = args.find((arg) => !arg.startsWith("--"));
const docker = args.includes("--docker");
const clean = !args.includes("--no-clean");
const exportImage = docker || args.includes("--export");

if (!target || target === "help") {
  console.log(`
Usage:
  node build/build.mjs <landing|web|docs|all> [options]

Options:
  --docker       Build the configured production Docker image.
  --export       Export the Docker image to a release .tar.
  --no-clean     Keep previous output for the selected target.

Examples:
  node build/build.mjs web
  node build/build.mjs web --docker
  RELEASE_VERSION=1.0.0 node build/build.mjs all --docker
`);
  process.exit(0);
}

const selected = target === "all" ? Object.keys(apps) : [target];

for (const name of selected) {
  if (!apps[name]) {
    throw new Error(`Unknown build target: ${name}`);
  }
}

function run(command, cwd) {
  console.log(`\n$ ${command}`);
  execFileSync("sh", ["-lc", command], {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
}

function version() {
  return process.env.RELEASE_VERSION
    ?? process.env.VERSION
    ?? "dev";
}

function safeVersion(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function copyBuildOutput(app, name, outputDir) {
  const appDir = resolve(ROOT, app.dir);
  const configured = app.output;

  if (!configured?.path) {
    throw new Error(
      `${name}: no output.path configured. ` +
      `The pipeline intentionally does not guess the framework or output directory.`
    );
  }

  const source = resolve(appDir, configured.path);

  if (!existsSync(source)) {
    throw new Error(
      `${name}: configured build output does not exist:\n` +
      `  ${relative(ROOT, source)}\n\n` +
      `The build command completed, but the pipeline cannot determine its output ` +
      `without an explicit build/config contract. Update build/config.mjs.`
    );
  }

  const sourceStat = statSync(source);

  if (configured.type === "directory" && !sourceStat.isDirectory()) {
    throw new Error(
      `${name}: output.path is configured as a directory but is not a directory: ` +
      relative(ROOT, source)
    );
  }

  if (configured.type === "file" && !sourceStat.isFile()) {
    throw new Error(
      `${name}: output.path is configured as a file but is not a file: ` +
      relative(ROOT, source)
    );
  }

  if (sourceStat.isDirectory()) {
    cpSync(source, outputDir, { recursive: true });
  } else {
    cpSync(source, join(outputDir, source.split("/").pop()));
  }

  return source;
}

function buildApp(name) {
  const app = apps[name];
  const appDir = resolve(ROOT, app.dir);
  const buildDir = join(BUILDS, name);
  const outputDir = join(buildDir, "output");

  if (!existsSync(appDir)) {
    throw new Error(`${name}: application directory does not exist: ${app.dir}`);
  }

  if (clean && existsSync(buildDir)) {
    rmSync(buildDir, { recursive: true, force: true });
  }

  mkdirSync(outputDir, { recursive: true });

  // The application remains responsible for its own build process.
  run(app.buildCommand, ROOT);

  const source = copyBuildOutput(app, name, outputDir);

  const metadata = {
    name,
    version: version(),
    sourceDirectory: app.dir,
    buildCommand: app.buildCommand,
    sourceOutput: relative(ROOT, source),
    collectedOutput: relative(ROOT, outputDir),
    output: app.output,
    runtime: app.runtime,
    generatedAt: new Date().toISOString(),
  };

  writeFileSync(
    join(buildDir, "build.json"),
    JSON.stringify(metadata, null, 2) + "\n",
  );

  console.log(
    `✓ ${name}: ${relative(ROOT, outputDir)} ` +
    `(source: ${relative(ROOT, source)})`
  );

  return { app, buildDir, outputDir };
}

function dockerize(name, result) {
  const app = result.app;
  const runtimeType = app.runtime?.type;

  if (!runtimeType) {
    throw new Error(
      `${name}: Docker requested but runtime.type is not configured.`
    );
  }

  const dockerfileName = {
    next: "next.Dockerfile",
    node: "node.Dockerfile",
    deno: "deno.Dockerfile",
    static: "static.Dockerfile",
  }[runtimeType];

  if (!dockerfileName) {
    throw new Error(
      `${name}: unsupported runtime type "${runtimeType}". ` +
      `Supported: next, node, deno, static.`
    );
  }

  const imageTag = `${app.image}:${safeVersion(version())}`;
  const latestTag = `${app.image}:latest`;
  const dockerfile = join(ROOT, "build", "docker", dockerfileName);
  const port = app.runtime.port ?? 3000;

  run(
    [
      "docker build",
      `-f "${dockerfile}"`,
      `--build-arg APP_NAME="${name}"`,
      `--build-arg PORT="${port}"`,
      `-t "${imageTag}"`,
      `-t "${latestTag}"`,
      `"${result.outputDir}"`,
    ].join(" "),
    ROOT,
  );

  if (exportImage) {
    const imageDir = join(result.buildDir, "image");
    mkdirSync(imageDir, { recursive: true });

    const tarPath = join(
      imageDir,
      `${name}-${safeVersion(version())}.tar`,
    );

    run(`docker save --output "${tarPath}" "${imageTag}"`, ROOT);

    console.log(`✓ ${name}: ${relative(ROOT, tarPath)}`);
  }

  return { imageTag, latestTag, runtime: runtimeType };
}

const release = {
  version: version(),
  generatedAt: new Date().toISOString(),
  targets: {},
};

for (const name of selected) {
  const result = buildApp(name);
  const image = docker ? dockerize(name, result) : undefined;

  release.targets[name] = {
    output: relative(ROOT, result.outputDir),
    ...(image ? { image } : {}),
  };
}

mkdirSync(BUILDS, { recursive: true });

writeFileSync(
  join(BUILDS, "release.json"),
  JSON.stringify(release, null, 2) + "\n",
);

console.log(
  `\nRelease manifest: ${relative(ROOT, join(BUILDS, "release.json"))}`
);
