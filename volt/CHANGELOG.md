# Changelog

All notable changes to Volt are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Brand identity kit under `volt/brand/` — logo, favicon, wordmark, lockups, light/dark OG social covers, and design tokens, all regenerable from `volt/brand/brand.json`.
- `/demo/branding` page and `task branding:gen` — documents every icon asset and regenerates the set from one source image.
- Typed GraphQL SDK via [gqlkit](https://github.com/ubgo/gqlkit) (`src/generated/sdk`, `src/lib/gql-clients.ts`) with a live `/demo/gqlkit` demo.
- Per-route typesafe document titles via `src/lib/seo.ts`.

### Changed
- Licensed under the Apache License 2.0 (previously a proprietary license); the repository is now public.
- Rebranded the project to **Volt** across the app (logo/favicon, manifest, page titles, sidebar) and docs.
- Migrated GraphQL tooling from graphql-codegen to gqlkit; removed all graphql-codegen traces.
- Upgraded the stack to latest (Vite 8, TypeScript 6, Base UI 1.6, Tailwind CSS v4).

### Removed
- graphql-codegen integration and its dependencies.
- Placeholder TanStack starter assets (`logo192/512.png`, circle/word logos).
