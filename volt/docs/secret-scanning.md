# Secret scanning

Volt keeps credentials out of git with two independent layers of secret scanning: a **local pre-commit hook** and a **GitHub Actions backstop**. Both use the same [gitleaks](https://github.com/gitleaks/gitleaks) config, so rules and allowlists live in one place. This guide covers enabling it, what happens when it fires, and how to tune it.

## The two layers

| Layer | Where it runs | Bypassable? | Catches a leak |
|---|---|---|---|
| Pre-commit hook (`.githooks/pre-commit`) | your machine, on `git commit` | yes — `--no-verify`, or if not installed | before the commit is created |
| GitHub Actions (`.github/workflows/gitleaks.yml`) | GitHub, on every push + PR | no | before it can be merged |

The hook is your fast first line of defense; the workflow is the backstop that can't be skipped.

## Enable it locally (one-time per clone)

```bash
task hooks:install
```

This does two things:

1. Points git at the repo's hooks — `git config --local core.hooksPath .githooks`.
2. Installs gitleaks via Homebrew if it's missing (or tells you how to install it manually).

Git hook configuration isn't shared through the repository, so **every clone runs this once**. It's listed as a setup step in [getting-started.md](getting-started.md#secret-scanning).

## How the pre-commit hook works

`.githooks/pre-commit` is a two-layer scanner (so it still protects you even if gitleaks isn't installed):

- **Layer 1 — gitleaks:** `gitleaks protect --staged --redact` runs the 200+ default detectors plus Volt's extra rules against the staged diff. `--redact` masks the value in output so it never lands in your terminal history or CI logs.
- **Layer 2 — regex fallback:** a project-tuned pattern list in the hook scans the *added* lines of the staged diff. It runs regardless of gitleaks, and only allows a match through if the matched substring is a documented placeholder.

If either layer finds something, the commit is rejected with the offending file, pattern, and a masked preview.

## The CI backstop

`.github/workflows/gitleaks.yml` runs `gitleaks detect` over the full history on every `push` and `pull_request`. It uses the same root `.gitleaks.toml`, so a clean local commit stays clean in CI. A failed scan shows a red check on the push/PR.

> To make a failed scan actually **block** a merge, add a branch-protection rule on `main` that requires the gitleaks status check (**Settings → Branches → Add rule → Require status checks to pass → gitleaks**). Without it, the check reports pass/fail but doesn't gate merging.

## When the scanner blocks you

1. **Move the value out of the code.** Put it in `.env` (already gitignored) and read it through the [typesafe env](configuration.md) — `env` from `@/env/server`, or an integration env like `drizzleEnv`. Never read `process.env` directly (see [../rules/code-standards.md](../rules/code-standards.md)).
2. **Re-stage and commit.**
3. **If it already reached a commit or push, rotate the credential immediately.** Removing it from history is not enough once it's been shared — treat any committed secret as compromised.

## False positives and allowlisting

If the value is genuinely not a secret (a placeholder, a doc example, a synthetic fixture), allowlist the *shape* — and keep **both** layers in sync:

- **gitleaks** — add to `.gitleaks.toml` `[allowlist]`: a `paths` entry (an entire file/glob) or a `regexes` entry (a placeholder shape that can't collide with a real credential).
- **regex fallback** — add the same placeholder shape to `ALLOW_RE` in `.githooks/pre-commit`.

Prefer placeholder shapes that a real credential can't match (e.g. `ghp_your_pat`, `sk-ant-xxx`, `[REDACTED-…]`). **Do not** add loose stopwords like `example` or `placeholder` — gitleaks stopwords match anywhere on a line and would silently exempt a real leak that happens to share the line. Already allowlisted: `*.md` docs, `.env.example`, `pnpm-lock.yaml`, `src/generated/`, and the two scanner config files themselves.

## Adding a new detector

To catch a token shape the defaults miss, add a rule to `.gitleaks.toml`:

```toml
[[rules]]
id = "my-service-token"
description = "MyService API token"
regex = '''mysvc_[A-Za-z0-9]{32}'''
keywords = ["mysvc_"]
```

Mirror the same regex into the `SECRET_PATTERNS` array in `.githooks/pre-commit` so the fallback layer catches it too.

## Manual scans

```bash
task secrets:scan          # gitleaks detect over the full history (thorough)
task secrets:scan:staged   # gitleaks protect against the staged diff only (fast)
```

## Bypass (use with care)

```bash
git commit --no-verify
```

This skips the local hook only — the CI backstop still runs on push/PR. If you find yourself bypassing repeatedly, that's a signal to fix the root cause (move the value to `.env`) or add a proper allowlist entry so the next person doesn't have to.

## Files involved

- `.gitleaks.toml` — the shared ruleset + allowlist (used by the hook and CI).
- `.githooks/pre-commit` — the two-layer local scanner.
- `.github/workflows/gitleaks.yml` — the CI backstop.
- `Taskfile.yml` — `hooks:install`, `secrets:scan`, `secrets:scan:staged`.

## Next / Related

- [getting-started.md](getting-started.md#secret-scanning) — the one-time setup step.
- [configuration.md](configuration.md) — the typesafe env you move secrets into.
- [../SECURITY.md](../SECURITY.md) — the vulnerability-reporting policy.
