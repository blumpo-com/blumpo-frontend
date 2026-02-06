# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router routes and layouts. Route groups use parentheses (e.g., `app/(dashboard)`), API routes under `app/api`.
- `components/`: Reusable React components. UI primitives live in `components/ui` (PascalCase filenames).
- `lib/`: Domain logic and utilities (`lib/auth`, `lib/db`, `lib/payments`, `lib/utils.ts`).
- Root config: `next.config.ts`, `tsconfig.json` (path alias `@/*`), `drizzle.config.ts`, `middleware.ts`.
- Env files: `.env` (local), `.env.example` (template). Never commit secrets.

## Build, Test, and Development Commands
- `pnpm dev`: Run the app locally with Turbopack on `http://localhost:3000`.
- `pnpm build`: Production build.
- `pnpm start`: Start the production server (after build).
- Database tooling (Drizzle):
  - `pnpm db:setup`: Create `.env` from template and prep local config.
  - `pnpm db:migrate`: Apply migrations.
  - `pnpm db:generate`: Generate migrations from schema.
  - `pnpm db:seed`: Seed dev data.
  - `pnpm db:studio`: Open Drizzle Studio.
- Stripe webhooks (optional): `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## Coding Style & Naming Conventions
- Language: TypeScript (strict). React 19, Next.js App Router.
- Indentation: 2 spaces; keep imports sorted; prefer named exports.
- Components: PascalCase (`components/UserCard.tsx`). Hooks: `useX` camelCase.
- Routes/segments: lowercase with dashes when needed; use groups like `app/(login)`.
- Styling: Tailwind CSS v4; co-locate minimal styles in `app/globals.css` or component-level classes.
- Imports: use `@/*` alias (e.g., `import { foo } from '@/lib/utils'`).

## Testing Guidelines
- No unit test runner is configured yet. If adding tests, prefer Vitest + React Testing Library.
- Place tests next to source (`Button.test.tsx`) or under `tests/` with mirrored paths.
- Keep server logic pure and testable in `lib/`; mock external services (Stripe, DB) in tests.

## Commit & Pull Request Guidelines
- Commits: Clear, scoped messages. Conventional Commits are encouraged (e.g., `feat: add team billing`, `fix: handle expired session`).
- PRs: Include description, linked issues, screenshots for UI, and notes on migration/seed changes. Ensure `pnpm build` succeeds and DB scripts run if affected.

## Security & Configuration Tips
- Store secrets in `.env`; mirror keys from `.env.example`. For deploys (e.g., Vercel), set env vars and Stripe webhook secrets per environment.

## Figma and Designs
- Round px values eg. 23.453px becomes 23px
- Ignore line-height properties and never add them to texts, when you base your design on figma layouts