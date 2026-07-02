# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in Volt, please report it privately — do **not** open a public issue.

Email **khanakia@gmail.com** with:

- a description of the vulnerability and its impact,
- steps to reproduce (a minimal proof of concept if possible),
- the affected version or commit.

You'll receive an acknowledgement within a few business days, and a fix or mitigation plan once the report is triaged. Please give a reasonable window for a fix before any public disclosure.

## Supported versions

Volt is delivered as a source starter that you fork into your own application. Security fixes are published to the main branch; licensed users should pull updates from there. Older snapshots are not separately patched.

## Secret scanning

Volt ships a two-layer pre-commit secret scanner to keep credentials out of git. Enable it once per clone:

```bash
task hooks:install
```

- **Layer 1 — [gitleaks](https://github.com/gitleaks/gitleaks):** scans the staged diff against `.gitleaks.toml` (default ruleset + project rules).
- **Layer 2 — regex fallback:** `.githooks/pre-commit` runs even without gitleaks installed.

There's also a **GitHub Actions backstop** (`.github/workflows/gitleaks.yml`) that scans every push and PR — it can't be bypassed. Manual scans: `task secrets:scan` (full history) · `task secrets:scan:staged` (staged only). If a real secret ever reaches a commit, rotate it immediately — scrubbing history alone is not enough once it's been pushed. The full workflow (CI, false positives, allowlisting, bypass) is in [docs/secret-scanning.md](docs/secret-scanning.md).

## Scope

This policy covers the Volt boilerplate source itself. Vulnerabilities in your own application code, or in third-party dependencies, should be reported to their respective maintainers.
