/*
 * Pipeline configuration.
 *
 * IMPORTANT:
 * This file describes the contract of each application. The pipeline does
 * not assume that every application is Next.js, Svelte, Vite, etc.
 *
 * `buildCommand` is the existing command owned by the application.
 * `output` describes what that command actually produces.
 * `runtime` describes how that output is served when Dockerizing.
 */
export const apps = {
  landing: {
    dir: "landing",
    buildCommand: "pnpm run build:landing",

    output: {
      type: "next-standalone",
      path: ".next/standalone",
    },

    runtime: {
      type: "next",
      port: 3000,
    },

    image: "voicebox/landing",
  },

  web: {
    dir: "web",
    buildCommand: "pnpm run build:web",

    // The Vite warning indicates this is likely `dist`, but verify it.
    output: {
      type: "directory",
      path: "dist",
    },

    runtime: {
      type: "static",
      port: 8080,
    },

    image: "voicebox/web",
  },

  docs: {
    dir: "docs",
    buildCommand: "pnpm run build:docs",

    // Replace with the actual docs build output.
    output: {
      type: "directory",
      path: "dist",
    },

    runtime: {
      type: "static",
      port: 8080,
    },

    image: "voicebox/docs",
  },
};
