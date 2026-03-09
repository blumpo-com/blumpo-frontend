---
name: create-pr-description
description: Generate a pull request title and description by analyzing the current branch's commit history and code changes. Use when the user asks for a PR description, PR body, or "stwórz opis PR".
---

# Create PR description

When invoked, generate a **pull request title and description** in English. Follow these steps and **always output the result as raw Markdown inside a single code block** (so the user sees the syntax and can copy it).

## Steps

1. **Get current branch and changes**
   - Run `git branch --show-current` to get the branch name (e.g. `feat/founders-landing`, `fix/bugs`).
   - Run `git log main..HEAD --oneline` (or `git log master..HEAD --oneline` if `main` does not exist) to list commits on this branch.
   - Run `git diff main...HEAD` (or `master...HEAD`) to see the actual code changes. Use this and the commit messages to understand what was done.

2. **Build the title from the branch name**
   - Split the branch on `/`: `prefix` = part before slash, `suffix` = part after slash.
   - **Prefix** → human label (first letter capitalized, common mappings):
     - `feat` → Feature
     - `fix` → Fix
     - `chore` → Chore
     - `docs` → Docs
     - `refactor` → Refactor
     - `style` → Style
     - `test` → Test
     - `perf` → Perf
     - For unknown prefixes, capitalize the first letter (e.g. `hotfix` → Hotfix).
   - **Suffix** → replace hyphens with spaces and use title case (e.g. `founders-landing` → Founders landing, `bugs` → Bugs).
   - **Title line**: `# [Prefix] - [Suffix]`  
     Examples: `# Feature - Founders landing`, `# Fix - Bugs`.

3. **Write the body**
   - **First line**: The title as above (single `#`).
   - **Description**: One short paragraph in English summarizing what this PR does, based on commits and diff. Keep it concise (2–5 sentences).
   - **Sections**: Add exactly these two subsections (each with `##`):
     - `## How to test` — leave a short placeholder or bullet list for the author to fill (e.g. "1. Check out branch, run `pnpm dev` …").
     - `## Screenshots` — leave a placeholder (e.g. "Add screenshots if UI changed.").

## Format rules

- Top-level title: one `#`.
- All other section headers: `##`.
- Entire PR description must be valid markdown and in **English**.
- Do not add extra headers or sections beyond the title, description, "How to test", and "Screenshots".
- **Output format**: wrap the whole PR description in **one code block** with language `markdown`, so the user sees raw Markdown syntax (headers, list markers, etc.) and can copy it. Do not output the description as rendered markdown outside a code block.

## Example output

Put the full PR description inside a single markdown code block, like this:

```markdown
# Feature - Founders landing

This PR adds the founders landing page with hero, pricing, and fit-your-brand sections. It includes new sections under `app/(landing)/_sections/` and updates the landing layout.

## How to test

1. Run `pnpm dev` and open the landing page.
2. Verify all sections render and links work.

## Screenshots

_Add screenshots if UI changed._
```

Deliver only this one code block (with the generated content),  no other commentary or duplicate rendered output.
