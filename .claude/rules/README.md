# Context-Specific Rules

Rules in this directory are read **on-demand** by LLMs only when performing specific actions.

## Purpose

- **Token optimization:** LLM only loads rules when needed
- **Focused context:** Each rule file contains only relevant instructions
- **Maintainability:** Rules are modular and easy to update

## Usage

LLMs should read the appropriate rule file before performing the action:

| File | Read Before |
|------|-------------|
| `code-standards.md` | Writing or editing any code (the standing engineering bar) |
| `git-commit.md` | Running `git commit` |

The full agent/developer guide is [`../../volt/CLAUDE.md`](../../volt/CLAUDE.md) (imported by the root `CLAUDE.md`); these rule files are the on-demand deep-dives it points to.

## Adding New Rules

1. Create `[action-name].md` in this directory
2. Add a row to the table above (and reference it from `volt/CLAUDE.md` if it's always-relevant)
3. Keep rules focused and concise

## Format

Each rule file should have:
- Clear title
- "Read this before..." instruction
- Required/Forbidden sections
- Examples where helpful
