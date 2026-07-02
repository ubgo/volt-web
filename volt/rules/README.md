# Volt rules

Volt's baseline engineering rules, read **on-demand** before the matching action. They live here (inside `volt/`) so they update as one unit with the rest of the Volt layer — a Volt update touches `volt/`, never your own rules.

`volt/CLAUDE.md` (in the root `CLAUDE.md` import chain) points agents at these.

| File | Read before |
|------|-------------|
| [code-standards.md](code-standards.md) | Writing or editing any code (the standing engineering bar) |
| [git-commit.md](git-commit.md) | Running `git commit` |

## Yours vs Volt's

- **Volt's rules** live here in `volt/rules/` — edit them, or pull Volt updates by replacing this folder.
- **Your own project rules** go in [`.claude/rules/`](../../.claude/rules/) — Volt never writes there, so your rules and Volt's never clash.

Reference your own rules from the root `CLAUDE.md` (add lines after the `@volt/CLAUDE.md` import).
