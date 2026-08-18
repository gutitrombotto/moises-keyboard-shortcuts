# CODESTYLE — Moises Keyboard Shortcuts

Conventions for all code in this repository. Non-negotiable; enforced by tooling wherever possible.

## Language

- **Everything in English**: code, comments, commit messages, file names, test descriptions, error messages, log output.

## Comments

- Comments are **rare, technical, and necessary**. Write one only to state a constraint the code cannot express: a non-obvious invariant (why the class match is a substring), a workaround for a documented browser/site behavior (why the guard exists in shell frames), a deliberate deviation from the spec.
- Never comment _what_ the code does, restate the line below, or narrate changes. If a block needs explanation, extract it into a well-named function instead.
- `TODO(name): description` format for known gaps; no orphan TODOs.

## Debuggability

- Code must be **debuggable by design**: small pure functions, explicit data flow, no clever one-liners that hide intermediate state.
- Every failure path is **visible**: a lookup miss resolves `null` and is surfaced at the orchestration layer as a prefixed console error plus an error toast, per the taxonomy in `SPECS.md` §9 — never a silently swallowed `catch`.
- All console output goes through the `lib/logger` wrapper (`[Moises Keyboard]` prefix) — no stray `console.log` (ESLint `no-console` enforces it).

## Formatting & Tooling

- **Prettier** formats everything; no manual style debates. Format-on-save and a pre-commit hook (husky + lint-staged).
- **ESLint** (typescript-eslint strict) must pass with zero warnings before commit.
- **TypeScript `strict: true`.** No `any` (use `unknown` + narrowing), no non-null assertions (`!`) outside tests, no `@ts-ignore` without a linked issue.

## Correctness Idioms

- **Explicit null checks**: `value == null` / `value != null`, never truthiness on values that could legitimately be falsy.
- **Mandatory braces** on every control block; no single-line `if` bodies (ESLint `curly` enforces it).
- **Callee above caller**: helpers are defined above the function that uses them; files read bottom-up toward the entry point.

## Structure (production-ready)

- Follow the file structure defined in `SPECS.md` §2.1 (normative tree). One module, one responsibility:
  - `lib/dom-finder/` — pure DOM queries over a passed-in `Document`; fully unit-testable against fixtures.
  - `lib/keyboard/` — pure shortcut resolution and input safety; no DOM mutation.
  - `lib/toast/`, `lib/feedback/` — the only modules that inject UI into the page.
  - `entrypoints/content.ts` — orchestration only; business rules live in `lib/`.
- Each `lib/` module exposes its **public API through its `index.ts`**; nothing outside the module imports its internal files.
- Dependency direction is one-way: `entrypoints → lib`. Never the reverse.
- Named exports only (no `default export`), except where the framework requires it (WXT entrypoints).
- File names: `kebab-case.ts`.

## Naming

- Descriptive over short: `findTrackContainer`, not `find`. Booleans read as predicates: `hasTrackControls`, `isDismissed`.
- No abbreviations except industry-standard ones (`url`, `id`, `html`).

## Testing

- All `lib/` logic requires unit tests (Vitest + happy-dom). DOM finders are tested against **saved HTML fixtures** replicating the real player and shell frames; every regression fix adds the failing page as a fixture first.
- Tests describe behavior: `it("stays inert on the shell frame, which has no track controls")`.
- **Manual verification matrix**: behavior changes are verified against the real player before release — happy path, input safety, frame inertness, error toasts, debounce (see ROADMAP §M5).

## Git

- Repository: public (MIT), `github.com/gutitrombotto/moises-keyboard-shortcuts`.
- **PR-based workflow**: changes land on `main` via pull request with green CI (lint + typecheck + test + build). Branch names: `feat/…`, `fix/…`, `chore/…`.
- Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`).
- Small, single-purpose commits; the build and tests must pass on every commit.
- No commented-out code, no dead files, no unused exports in the tree.
