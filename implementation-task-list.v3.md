# Unified Management Platform — Implementation Task Catalogue (v2)

> **Legend for every Task**
>
> - **Goal** – High‑level objective.
> - **Sub‑goals** – Fine‑grained, sequential milestones.
> - **Files & Locations** – Exact new or modified paths.
> - **Minimal External Libraries** – `pnpm add` or `pnpm add -D`; avoid heavy deps by in‑house coding when trivial.
> - **Tests** – Must be automated (unit, integration, E2E, accessibility, perf).

Root directory layout (reference once):

```tree
root/
 ├─ apps/
 │   ├─ mobile/
 │   └─ admin/
 ├─ packages/
 │   ├─ core/
 │   ├─ engine/
 │   ├─ ui/
 │   ├─ plugins/
 │   └─ infra-scripts/
 ├─ templates/
 ├─ infra/
 │   └─ k8s/
 └─ .github/
```

---

## 0 · Foundational Setup

### T‑0.1  Establish Monorepo Workspace

1. **Goal** Monorepo skeleton ready for iterative work.

2. **Sub‑goals**

   1. Initialize git + first commit.
   2. Create shared workspace (`pnpm-workspace.yaml`).
   3. Configure TurboRepo build pipeline.
   4. Add commit hooks (lint & format).
   5. Configure VS Code defaults & recommended extensions.

3. **Files & Locations**

   ```tree
   /.gitignore
   /README.md
   /package.json              (workspaces + scripts)
   /pnpm-workspace.yaml
   /turbo.json
   /.vscode/settings.json
   /.husky/pre-commit         (runs eslint prettier)
   /.commitlintrc.cjs         (basic regex check, no heavy lib)
   ```

4. **Minimal External Libraries**
   `pnpm add -D turbo eslint prettier husky lint-staged`
   _Commit‑msg lint implemented via 10‑line Node script in `/scripts/simpleCommitLint.mjs`; avoid @commitlint._

5. **Tests**
   1. `pnpm i && pnpm lint` exits 0.
   2. Pre‑commit rejects file with `console.log('lint‑fail')`.
   3. GitHub Action (`.github/workflows/ci.yml`) clones repo, runs `pnpm test` ≤ 5 min.

---

### T‑0.2  Configure TypeScript Project References

1. **Goal** Fast incremental builds & strong type isolation across packages.

2. **Sub‑goals**

   1. Create root `tsconfig.base.json` (ES2022, modules, strict).
   2. Add `tsconfig.json` in every package + reference chain.
   3. Wire Turbo build graph (`turbo.json`).

3. **Files & Locations**

   ```tree
   /tsconfig.base.json
   /packages/*/tsconfig.json
   /apps/*/tsconfig.json
   ```

4. **Minimal External Libraries**
   No runtime deps – uses builtin `typescript` already installed dev‑dependency (`pnpm add -D typescript`).

5. **Tests**
   1. `pnpm run build` builds all packages to `dist/`.
   2. Introduce circular import -> `tsc -b` fails; remove -> succeeds.

---

### T‑0.3  CI / CD Bootstrap

1. **Goal** Automated quality gates on every PR.

2. **Sub‑goals**

   1. Create reusable GitHub Action for lint + test + build.
   2. Add Vercel preview deploy workflow.
   3. Protect `main` branch with required checks.

3. **Files & Locations**

   ```tree
   /.github/workflows/ci.yml         (matrix lint/test/build)
   /.github/workflows/preview.yml    (Vercel deploy)
   ```

4. **Minimal External Libraries**
   No new libs; uses PNPM cache action and Vercel CLI (already provided by Vercel).

5. **Tests**
   1. New PR shows ✓ or ✗ on CI.
   2. Passing PR comment contains Vercel preview URL.

---

### T‑0.4  Environment Variable Strategy

1. **Goal** Consistent env var management across local, CI, and production.

2. **Sub‑goals**

   1. Add `.env.example` with placeholders.
   2. Integrate `dotenv-expand` in dev scripts.
   3. Document required secrets in README.

3. **Files & Locations**

   ```tree
   /.env.example
   ```

4. **Minimal External Libraries**
   `pnpm add -D dotenv dotenv-expand`

5. **Tests**

   1. `pnpm dev` reads vars without crash when .env present.
   2. CI build injects secrets via GitHub actions env.

---

### T‑0.5  Pre‑Push Bundle Size Guard

1. **Goal** Prevent oversized client bundles entering main branch.

2. **Sub‑goals**

   1. Install `size-limit`.
   2. Configure threshold 200 kB per entry.
   3. Add pre‑push git hook.

3. **Files & Locations**

   ```tree
   /.size-limit.cjs
   /.husky/pre-push
   ```

4. **Minimal External Libraries**
   `pnpm add -D size-limit @size-limit/preset-small-lib husky`

5. **Tests**

   1. Commit exceeding threshold fails hook.

---

## 1 · Canonical Types & Shared Utilities (`packages/core`)

### T‑1.1  Implement Canonical TypeScript Interfaces

1. **Goal** Single‑source domain model.

2. **Sub‑goals**

   1. Translate Appendix A types into TS.
   2. Export barrel file.
   3. Freeze enums / string unions.

3. **Files & Locations**

   ```tree
   /packages/core/src/types.ts
   /packages/core/src/index.ts
   ```

4. **Minimal External Libraries**
   None – pure TypeScript.

5. **Tests**
   1. `ts-node` script imports every type w/o error.
   2. Jest asserts `MatchStatus` union matches spec.

---

### T‑1.2  Publish Core Package

1. **Goal** Downstream packages can depend on `@ump/core`.

2. **Sub‑goals**

   1. Add `package.json` with `exports` + build script.
   2. Generate `.d.ts` via `tsc -p .`.
   3. Add `prepublishOnly` verifying build passes.

3. **Files & Locations**

   ```tree
   /packages/core/package.json
   /packages/core/tsconfig.json
   /packages/core/dist/**        (git‑ignored)
   ```

4. **Minimal External Libraries**
   None – rely on root `typescript`.

5. **Tests**
   1. `import { Match } from '@ump/core'` inside mobile app compiles.
   2. `pnpm --filter @ump/core test` passes.

---

### T‑1.3  GraphQL Code Generation

1. **Goal** Generate fully‑typed GraphQL hooks for React 18 + TS.

2. **Sub‑goals**

   1. Install `@graphql-codegen/cli` and presets.
   2. Add `codegen.yml` covering gateway schema.
   3. Configure watch in Turbo pipeline.

3. **Files & Locations**

   ```tree
   /codegen.yml
   /packages/core/generated/
   ```

4. **Minimal External Libraries**
   `pnpm add -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-query`

5. **Tests**

   1. `pnpm run codegen` produces zero errors.
   2. Generated hooks compile in mobile app.

---

## 2 · Plugin Runtime (`packages/engine`)

### T‑2.1  Create Plugin Registry Module

1. **Goal** Central registry for loading & resolving plugins.

2. **Sub‑goals**

   1. Design `PluginMeta` interface.
   2. Implement in‑memory Maps per category.
   3. Provide `register()` + `get()` helpers with validation.

3. **Files & Locations**

   ```tree
   /packages/engine/src/registry.ts
   /packages/engine/src/errors.ts
   ```

4. **Minimal External Libraries**
   None – use `semver` **light‑weight subset implemented in‑house**:

   ```ts
   // /packages/engine/src/semverLite.ts – ~40 LOC covering ^, ~ and exact match
   ```

5. **Tests**
   1. Duplicate ID throws `ValidationError`.
   2. Unknown get throws.
   3. Integration with sample plugins.

---

### T‑2.2  Implement VM2 Sandbox Executor

1. **Goal** Secure execution of third‑party plugin logic.

2. **Sub‑goals**

   1. Wrap `vm2` with restricted globals.
   2. Limit memory & CPU.
   3. Expose safe `ctx` (eventBus, shared store, CRUD proxies).

3. **Files & Locations**

   ```tree
   /packages/engine/src/sandbox/index.ts
   /packages/engine/src/sandbox/types.ts
   ```

4. **Minimal External Libraries**
   `pnpm add vm2` (no heavy alternatives).

5. **Tests**
   1. Attempt `require('fs')` → error.
   2. Memory leak guard terminates.

---

### T‑2.3  Event Bus Implementation

1. **Goal** Lightweight pub/sub within engine and between plugins.

2. **Sub‑goals**

   1. Code micro‑emitter (\~30 LOC) instead of adding `mitt`.
   2. Integrate with sandbox context.
   3. Ensure TypeScript events map.

3. **Files & Locations**

   ```tree
   /packages/engine/src/eventBus.ts
   ```

4. **Minimal External Libraries**
   None – custom emitter.

5. **Tests**
   1. Subscriber receives payload.
   2. Engine publishes events; plugin consumes.

---

### T‑2.4  Shared Context Store

1. **Goal** Cross‑plugin data cache.

2. **Sub‑goals**

   1. Implement `SharedStore` wrapper around `Map<key, WeakRef<any>>`.
   2. Expose GC‑friendly API.

3. **Files & Locations**

   ```tree
   /packages/engine/src/sharedStore.ts
   ```

4. **Minimal External Libraries**
   None.

5. **Tests**
   1. `set/get` round‑trip.
   2. FinalisationRegistry frees.

---

### T‑2.5  Lifecycle Hooks Dispatcher

1. **Goal** Invoke plugin hooks in deterministic order with isolation.

2. **Sub‑goals**

   1. Maintain hook registry keyed by event.
   2. Serially await hooks; capture errors.
   3. Provide context injection.

3. **Files & Locations**

   ```tree
   /packages/engine/src/hooksDispatcher.ts
   ```

4. **Minimal External Libraries**
   None.

5. **Tests**
   1. BonusPlugin’s hook fires.
   2. Error in one hook logged, does not halt chain.

---

### T‑2.6  Conformance Harness

1. **Goal** Automated QA suite for plugin authors.

2. **Sub‑goals**

   1. Provide Jest template.
   2. Include React 18 SSR smoke test.
   3. Validate lifecycle + metadata.

3. **Files & Locations**

   ```tree
   /templates/plugin‑harness/**
   /packages/engine/src/harness/index.ts
   ```

4. **Minimal External Libraries**
   `pnpm add -D jest ts‑jest @testing-library/react @testing-library/jest-dom` (already root level).

5. **Tests**
   1. Missing `validateScore` fails.
   2. SSR errors surface.

---

## 3 · Shared UI Library (`packages/ui`)

### T‑3.1  Setup shadcn/ui Base Components

1. **Goal** Reusable, themeable components.

2. **Sub‑goals**

   1. Install Tailwind & shadcn CLI.
   2. Generate Button, Card, Dialog components.
   3. Add Storybook stories.

3. **Files & Locations**

   ```tree
   /packages/ui/tailwind.config.ts
   /packages/ui/src/components/{Button,Card,Dialog}.tsx
   /.storybook/** (workspace‑root, refs packages/ui)
   ```

4. **Minimal External Libraries**
   `pnpm add tailwindcss class-variance-authority` (skip HeadlessUI; not needed yet)

5. **Tests**
   1. Storybook renders.
   2. Jest‑DOM style & aria.

---

### T‑3.2  Accessibility Enforcement Tests

1. **Goal** WCAG AA at component level.

2. **Sub‑goals**

   1. Integrate `jest-axe`.
   2. Write axe test per component.

3. **Files & Locations**

   ```tree
   /packages/ui/src/__tests__/*a11y.test.tsx
   ```

4. **Minimal External Libraries**
   `pnpm add -D jest-axe`.

5. **Tests**
   1. Axe passes; breaks on missing label.

---

### T‑3.3  Visual Regression Tests

1. **Goal** Detect unintended UI changes via screenshot diffs.

2. **Sub‑goals**

   1. Integrate Chromatic GitHub Action (free tier).
   2. Add baseline snapshots for core components.

3. **Files & Locations**

   ```tree
   /.github/workflows/chromatic.yml
   ```

4. **Minimal External Libraries**
   `pnpm add -D chromatic` (uses existing Storybook)

5. **Tests**

   1. PR with changed CSS fails when diff > 1%.

---

## 4 · Mobile‑First PWA (`apps/mobile`)

### T‑4.1  Bootstrap Next.js 14 App Router

1. **Goal** Skeleton PWA ready.

2. **Sub‑goals**

   1. Scaffold with `create-next-app`.
   2. Add Tailwind & alias paths.
   3. Connect to shared UI library.

3. **Files & Locations**

   ```tree
   /apps/mobile/next.config.mjs
   /apps/mobile/tailwind.config.ts
   /apps/mobile/src/app/page.tsx
   ```

4. **Minimal External Libraries**
   `pnpm add next@14 react@18 react-dom@18` (already) + `pnpm add -D tailwindcss postcss autoprefixer`.

5. **Tests**
   1. `pnpm dev` serves `/` 200.
   2. ESLint passes.

---

### T‑4.2  Integrate Service Worker (next‑pwa)

1. **Goal** Offline caching.

2. **Sub‑goals**

   1. Add `next-pwa` plugin.
   2. Configure runtime caching.
   3. Test offline.

3. **Files & Locations**

   ```tree
   /apps/mobile/next.config.mjs    (with next‑pwa)
   /apps/mobile/public/sw.js       (auto‑generated)
   ```

4. **Minimal External Libraries**
   `pnpm add next-pwa`.

5. **Tests**
   1. Lighthouse PWA ≥90.
   2. Cypress offline test.

---

### T‑4.3  GraphQL Client Setup

1. **Goal** Query & subscribe to gateway.

2. **Sub‑goals**

   1. Install Apollo Client.
   2. Configure HTTP & WS split link.
   3. Implement auth link (Clerk JWT).

3. **Files & Locations**

   ```tree
   /apps/mobile/src/lib/apolloClient.ts
   ```

4. **Minimal External Libraries**
   `pnpm add @apollo/client graphql graphql-ws`.

5. **Tests**
   1. Jest renders list via mock server.
   2. WS mock pushes event.

---

### T‑4.4  Internationalization via next‑intl

1. **Goal** Multi‑locale support.

2. **Sub‑goals**

   1. Install `next-intl`.
   2. Add `middleware.ts` locale detection.
   3. Provide `en.json`, `es.json`.

3. **Files & Locations**

   ```tree
   /apps/mobile/src/i18n/{en,es}.json
   /apps/mobile/middleware.ts
   ```

4. **Minimal External Libraries**
   `pnpm add next-intl`.

5. **Tests**
   1. Cypress changes locale.
   2. Missing key compile error.

---

### T‑4.5  Player / Spectator Views MVP

1. **Goal** Functional schedule & live scores.

2. **Sub‑goals**

   1. Implement MySchedule page.
   2. Add LiveScores page with subscription hook.
   3. Show Leaderboard table.

3. **Files & Locations**

   ```tree
   /apps/mobile/src/app/(spectator)/schedule/page.tsx
   /apps/mobile/src/app/(spectator)/live/page.tsx
   /apps/mobile/src/hooks/useMatchSubscription.ts
   ```

4. **Minimal External Libraries**
   Reuse existing; no new.

5. **Tests**
   1. E2E shows matches.
   2. Score diff animates (use Framer Motion already in UI lib `pnpm add framer-motion`).
   3. Axe passes.

---

## 5 · Admin Console (`apps/admin`)

### T‑5.1  Bootstrap Next.js Admin App

1. **Goal** Admin SPA base.

2. **Sub‑goals**

   1. Scaffold Next app.
   2. Share Tailwind config.
   3. Setup vite proxy for dev GraphQL.

3. **Files & Locations**

   ```tree
   /apps/admin/**
   ```

4. **Minimal External Libraries**
   Same as mobile.

5. **Tests**
   1. `pnpm dev` returns 200.

---

### T‑5.2  Tournament Setup Wizard

1. **Goal** Step‑by‑step tournament config.

2. **Sub‑goals**

   1. Build multi‑step form with react‑hook‑form.
   2. Add zod validation schema.
   3. Persist draft to backend.

3. **Files & Locations**

   ```tree
   /apps/admin/src/app/(wizard)/setup/page.tsx
   /apps/admin/src/components/forms/TournamentWizard.tsx
   ```

4. **Minimal External Libraries**
   `pnpm add react-hook-form zod`.

5. **Tests**
   1. Unit validation.
   2. E2E draft restored.

---

### T‑5.3  Phase / Plugin Selection UIs

1. **Goal** Select sport & phase plugins.

2. **Sub‑goals**

   1. Fetch registry.
   2. Render plugin cards.
   3. Validation of capability flags.

3. **Files & Locations**

   ```tree
   /apps/admin/src/components/PluginPicker.tsx
   ```

4. **Minimal External Libraries**
   None.

5. **Tests**
   1. Insufficient `statTier` rejected.
   2. Snapshot test.

---

### T‑5.4  Schedule Calendar with Drag‑Drop

1. **Goal** Manual allocation UI.

2. **Sub‑goals**

   1. Integrate FullCalendar.
   2. Enable drag‑drop.
   3. Lock icon & override mutation.

3. **Files & Locations**

   ```tree
   /apps/admin/src/components/ScheduleCalendar.tsx
   ```

4. **Minimal External Libraries**
   `pnpm add @fullcalendar/react @fullcalendar/daygrid` (skip heavy bundles).

5. **Tests**
   1. Cypress drag‑drop.
   2. Locked match blocked.

---

### T‑5.5  Audit Log Dashboard

1. **Goal** Administrative audit view.

2. **Sub‑goals**

   1. Build virtualized table (react‑window).
   2. Filters & CSV download.

3. **Files & Locations**

   ```tree
   /apps/admin/src/components/LogTable.tsx
   ```

4. **Minimal External Libraries**
   `pnpm add react-window` (vs AG‑Grid heavy).

5. **Tests**
   1. Fetches 20 rows.
   2. Axe passes.

---

## 6 · Auth & RBAC

### T‑6.1  Integrate Clerk Auth

1. **Goal** Authentication & JWT.

2. **Sub‑goals**

   1. Install Clerk SDK.
   2. Protect pages via middleware.
   3. Inject auth into GraphQL context.

3. **Files & Locations**

   ```tree
   /apps/*/middleware.ts
   /packages/core/src/auth/clerkProvider.ts
   ```

4. **Minimal External Libraries**
   `pnpm add @clerk/nextjs`.

5. **Tests**
   1. Unauth call 401.
   2. Auth flow success.

---

### T‑6.2  RBAC Middleware

1. **Goal** Role‑based resolver guard.

2. **Sub‑goals**

   1. Implement `@RequiresRole` decorator.
   2. Load roles from DB.
   3. Add tests.

3. **Files & Locations**

   ```tree
   /packages/engine/src/rbac/requireRole.ts
   ```

4. **Minimal External Libraries**
   None.

5. **Tests**
   1. Denies player.
   2. OrgOwner passes.

---

## 7 · GraphQL API Gateway

### T‑7.1  Apollo Federation Setup

1. **Goal** Compose sub‑graphs.

2. **Sub‑goals**

   1. Create gateway server (Express or Next.js API).
   2. Load plugin schemas dynamically.
   3. Compose with Rover.

3. **Files & Locations**

   ```tree
   /packages/gateway/src/index.ts
   /packages/gateway/supergraph.graphql
   ```

4. **Minimal External Libraries**
   `pnpm add @apollo/server @apollo/subgraph-stitcher graphql`.

5. **Tests**
   1. `rover supergraph compose` succeeds.
   2. Query field returns 200.

---

### T‑7.2  Error Model Surface

1. **Goal** Consistent error codes.

2. **Sub‑goals**

   1. Map errors to GraphQL extensions.
   2. Log stack internally only.

3. **Files & Locations**

   ```tree
   /packages/gateway/src/errorMapper.ts
   ```

4. **Minimal External Libraries**
   None.

5. **Tests**
   1. INVALID_SCORE code.
   2. Stack not sent.

---

### T‑7.3  Contract Tests (Gateway ↔ Clients)

1. **Goal** Ensure breaking GraphQL changes are caught early.

2. **Sub‑goals**

   1. Add Pact setup in gateway.
   2. Generate consumer contracts in mobile/admin CI.

3. **Files & Locations**

   ```tree
   /packages/gateway/tests/contract/*
   ```

4. **Minimal External Libraries**
   `pnpm add -D @pact-foundation/pact`

5. **Tests**

   1. CI fails when new field removal breaks contract.

---

## 8 · Real‑Time Layer

### T‑8.1  WebSocket PubSub Service

1. **Goal** Broadcast live updates ≤200 ms.

2. **Sub‑goals**

   1. Spin up ws server.
   2. Redis pub/sub for scale.
   3. JWT validation.

3. **Files & Locations**

   ```tree
   /packages/realtime/src/index.ts
   ```

4. **Minimal External Libraries**
   `pnpm add ws ioredis`.

5. **Tests**
   1. Load 5k clients ≤250 ms.
   2. Invalid JWT disconnects.

---

### T‑8.2  Client Side Diff & Patch Renderer

1. **Goal** Efficient UI updates.

2. **Sub‑goals**

   1. Implement `createPatch` util (20 LOC) vs jsondiffpatch.
   2. `useMatchDiff` hook.

3. **Files & Locations**

   ```tree
   /apps/mobile/src/hooks/useMatchDiff.ts
   /packages/core/src/utils/createPatch.ts
   ```

4. **Minimal External Libraries**
   None (custom diff sufficient for flat match object).

5. **Tests**
   1. Patch updates single field.
   2. No extra re‑render.

---

## 9 · Scheduling & Allocation

### T‑9.1  Greedy Scheduler Plugin

1. **Goal** Baseline fast scheduler.

2. **Sub‑goals**

   1. Parse input constraints.
   2. Earliest‑fit loop.
   3. Validate constraints.

3. **Files & Locations**

   ```tree
   /packages/plugins/scheduling/greedy/index.ts
   ```

4. **Minimal External Libraries**
   None.

5. **Tests**
   1. Constraint violation test.

---

### T‑9.2  ILP Scheduler (ilp_v1)

1. **Goal** Optimal allocation via ILP.

2. **Sub‑goals**

   1. Model variables.
   2. Solve with JS‑LP‑Solver.
   3. Timeout guard.

3. **Files & Locations**

   ```tree
   /packages/plugins/scheduling/ilp_v1/index.ts
   ```

4. **Minimal External Libraries**
   `pnpm add javascript-lp-solver`.

5. **Tests**
   1. Optimal vs greedy.
   2. Timeout error.

---

### T‑9.3  Day Bucket Scheduler

1. **Goal** Balance matches by day.

2. **Sub‑goals**

   1. Group matches.
   2. Call greedy.
   3. Return schedule.

3. **Files & Locations**

   ```tree
   /packages/plugins/scheduling/dayBucket/index.ts
   ```

4. **Minimal External Libraries**
   None.

5. **Tests**
   1. Snapshot 30 matches.

---

## 10 · Sport & Phase Plugins

### T‑10.1  Rugby SportPlugin (reference)

1. **Goal** Fully‑featured rugby scoring logic.

2. **Sub‑goals**

   1. `calculateTotalScore`.
   2. `validateScore`.
   3. UI Components.

3. **Files & Locations**

   ```tree
   /packages/plugins/sports/rugby/index.ts
   /packages/plugins/sports/rugby/RugbyScoreInput.tsx
   ```

4. **Minimal External Libraries**
   None.

5. **Tests**
   1. Try + conversion.
   2. Negative score error.

---

### T‑10.2  Round Robin PhasePlugin

1. **Goal** All‑play‑all generator.

2. **Sub‑goals**

   1. Enumerate pairs.
   2. Return match array.

3. **Files & Locations**

   ```tree
   /packages/plugins/phases/roundRobin/index.ts
   ```

4. **Minimal External Libraries**
   None.

5. **Tests**
   1. 4 teams = 6 matches.

---

### T‑10.3  Knockout PhasePlugin

1. **Goal** Single elimination bracket.

2. **Sub‑goals**

   1. Seed teams.
   2. Generate bracket.
   3. Optional 3rd place.

3. **Files & Locations**

   ```tree
   /packages/plugins/phases/knockout/index.ts
   ```

4. **Minimal External Libraries**
   None.

5. **Tests**
   1. 8 teams = 7 matches.

---

## 11 · Observability & Audit Logs

### T‑11.1  Partitioned Audit Log Table

1. **Goal** Immutable monthly partitions.

2. **Sub‑goals**

   1. Write DDL.
   2. Trigger function.

3. **Files & Locations**

   ```tree
   /infra/sql/001_audit_partitions.sql
   ```

4. **Minimal External Libraries**
   None.

5. **Tests**
   1. pg test insert routes.

---

### T‑11.2  Immutable Write API

1. **Goal** Log every mutation.

2. **Sub‑goals**

   1. `logService.log`.
   2. Attach to CRUD handlers.

3. **Files & Locations**

   ```tree
   /packages/engine/src/logging/logService.ts
   ```

4. **Minimal External Libraries**
   None.

5. **Tests**
   1. SCORE_SUBMISSION row logged.

---

### T‑11.3  CSV / NDJSON Export Endpoint

1. **Goal** Downloadable audit export.

2. **Sub‑goals**

   1. Stream rows.
   2. Log EXPORT event.

3. **Files & Locations**

   ```tree
   /apps/admin/src/pages/api/audit/export.ts
   ```

4. **Minimal External Libraries**
   None (use Node streams).

5. **Tests**
   1. GET returns CSV.

---

## 12 · Accessibility & Compliance

### T‑12.1  Global a11y Test Suite

1. **Goal** WCAG across screens.

2. **Sub‑goals**

   1. Add `axe-playwright` to E2E.
   2. CI failure on violations.

3. **Files & Locations**

   ```tree
   /apps/*/tests/e2e/a11y.spec.ts
   ```

4. **Minimal External Libraries**
   `pnpm add -D @axe-core/playwright`.

5. **Tests**
   1. Contrast violation fails.

---

### T‑12.2  GDPR Consent Handling in Plugins

1. **Goal** Helpers for personal data.

2. **Sub‑goals**

   1. `useConsentCheckbox` component.
   2. `ctx.anonymize` util.

3. **Files & Locations**

   ```tree
   /packages/ui/src/components/ConsentCheckbox.tsx
   /packages/engine/src/privacy/anonymize.ts
   ```

4. **Minimal External Libraries**
   None (hashing via built‑in `crypto`).

5. **Tests**
   1. Plugin without checkbox fails harness.

---

### T‑12.3  OWASP Baseline Security Headers

1. **Goal** Ship sensible HTTP security headers everywhere.

2. **Sub‑goals**

   1. Add `helmet` middleware in API gateway.
   2. Configure CSP, HSTS, X‑Content‑Type‑Options.
   3. Write docs for overrides.

3. **Files & Locations**

   ```tree
   /packages/gateway/src/middleware/securityHeaders.ts
   ```

4. **Minimal External Libraries**
   `pnpm add helmet`

5. **Tests**

   1. Headers present in staging env via curl.

---

## 13 · Dev Ops / Infra

### T‑13.1  Docker Compose for Local Dev

1. **Goal** One‑command dev env.

2. **Sub‑goals**

   1. Write compose file.
   2. Healthchecks.

3. **Files & Locations**

   ```tree
   /docker-compose.yml
   ```

4. **Minimal External Libraries**
   Docker images only.

5. **Tests**
   1. Compose up healthchecks OK.

---

### T‑13.2  Kubernetes Manifests

1. **Goal** Prod deployment templates.

2. **Sub‑goals**

   1. Write Helm chart.
   2. KIND cluster apply.

3. **Files & Locations**

   ```tree
   /infra/k8s/Chart.yaml
   /infra/k8s/templates/**
   ```

4. **Minimal External Libraries**
   Helm (CLI).

5. **Tests**
   1. `helm template` passes.

---

### T‑13.3  OpenTelemetry Tracing

1. **Goal** Distributed tracing.

2. **Sub‑goals**

   1. Instrument engine.
   2. Export OTLP.

3. **Files & Locations**

   ```tree
   /packages/engine/src/telemetry/otel.ts
   ```

4. **Minimal External Libraries**
   `pnpm add @opentelemetry/api @opentelemetry/sdk-node`.

5. **Tests**
   1. Jaeger shows spans.

---

### T‑13.4  Database Migrations & Seed Scripts

1. **Goal** Automated DB schema evolution and seed data.

2. **Sub‑goals**

   1. Install Prisma ORM.
   2. Create `prisma/migrations` folder.
   3. Add `pnpm db:migrate` and `db:seed` scripts.

3. **Files & Locations**

   ```tree
   /prisma/schema.prisma
   /prisma/seed.ts
   ```

4. **Minimal External Libraries**
   `pnpm add prisma @prisma/client`

5. **Tests**

   1. `pnpm db:migrate` applies latest migration.
   2. Local dev gets sample Org data.

---

### T‑13.5  Central Metrics & Alerting

1. **Goal** Single pane of glass for uptime and core metrics.

2. **Sub‑goals**

   1. Deploy Prometheus + Grafana docker compose.
   2. Create dashboard for API latency & error rate.
   3. Set alerts to Discord via webhook.

3. **Files & Locations**

   ```tree
   /infra/monitoring/docker-compose.metrics.yml
   ```

4. **Minimal External Libraries**
   `pnpm add -D prom-client` in gateway

5. **Tests**

   1. Grafana shows live requests per second.
   2. Alert fires when 5xx > 1% 5m.

---

### T‑13.6  Back‑up & Restore Strategy

1. **Goal** Daily Postgres & object store snapshots with retention.

2. **Sub‑goals**

   1. Add cron in K8s for `pg_dump` to S3.
   2. Document restore procedure.

3. **Files & Locations**

   ```tree
   /infra/k8s/cron-backup.yaml
   ```

4. **Minimal External Libraries**
   Uses `aws s3 cp` CLI (no new deps)

5. **Tests**

   1. Backup file appears in S3, restore brings db online.

---

## 14 · Continuous Integration & Delivery

### T‑14.1  Test Coverage Gates

1. **Goal** ≥85 % core & engine.

2. **Sub‑goals**

   1. Add Jest coverage threshold.
   2. CI job fails < threshold.

3. **Files & Locations**

   ```tree
   /jest.config.js
   ```

4. **Minimal External Libraries**
   None (Jest already).

5. **Tests**
   1. Delete test → CI fails.

---

### T‑14.2  Automated Plugin Conformance on PR

1. **Goal** Run harness per plugin.

2. **Sub‑goals**

   1. Matrix job over `packages/plugins/*`.
   2. Fail on missing metadata.

3. **Files & Locations**

   ```tree
   /.github/workflows/plugin‑matrix.yml
   ```

4. **Minimal External Libraries**
   None.

5. **Tests**
   1. Missing key fails.

---

### T‑14.3  Docker Image Publish

1. **Goal** Tag images to GHCR.

2. **Sub‑goals**

   1. Build multi‑arch image.
   2. Push on release tag.

3. **Files & Locations**

   ```tree
   /.github/workflows/release.yml
   ```

4. **Minimal External Libraries**
   Uses docker buildx action.

5. **Tests**
   1. `gh release` triggers image.

---

### T‑14.4  Lighthouse CI Performance Budget

1. **Goal** Enforce web‑vitals and PWA score on every commit.

2. **Sub‑goals**

   1. Setup `lighthouseci` GitHub Action.
   2. Configure budgets.json thresholds.

3. **Files & Locations**

   ```tree
   /.github/workflows/lhci.yml
   /lighthouse/budgets.json
   ```

4. **Minimal External Libraries**
   `pnpm add -D @lhci/cli`

5. **Tests**

   1. PR fails if FCP > 2.5 s on mobile.

---

### T‑14.5  Secret Scanning in CI

1. **Goal** Prevent accidental secret commits.

2. **Sub‑goals**

   1. Enable GitHub Advanced Security or add `gitleaks` scan.
   2. Block merge on finding secrets.

3. **Files & Locations**

   ```tree
   /.github/workflows/secret-scan.yml
   ```

4. **Minimal External Libraries**
   `pnpm add -D gitleaks`

5. **Tests**

   1. Commit with dummy key fails CI.

---

## 15 · Marketplace & Remote Bundles

### T‑15.1  Signed Bundle Fetcher

1. **Goal** Secure remote bundle load.

2. **Sub‑goals**

   1. Download file.
   2. SHA‑256 verify via Node crypto.
   3. Cache bundle.

3. **Files & Locations**

   ```tree
   /packages/engine/src/remote/fetchRemoteBundle.ts
   ```

4. **Minimal External Libraries**
   None (crypto).

5. **Tests**
   1. Tampered hash rejected.

---

### T‑15.2  Marketplace Listing Page

1. **Goal** Public plugin gallery.

2. **Sub‑goals**

   1. Query registry.
   2. Render cards.
   3. Install button.

3. **Files & Locations**

   ```tree
   /apps/mobile/src/app/marketplace/page.tsx
   ```

4. **Minimal External Libraries**
   None.

5. **Tests**
   1. Install success.

---

## 16 · Edge‑Case & Risk Mitigations

### T‑16.1  Duplicate Score Submission Guard (R‑1)

1. **Goal** Block duplicate writes within 2 s.

2. **Sub‑goals**

   1. Add DB unique constraint.
   2. Service‑level check.

3. **Files & Locations**

   ```tree
   /infra/sql/002_dedupe_scores.sql
   /packages/engine/src/guards/dedupeScore.ts
   ```

4. **Minimal External Libraries**
   None.

5. **Tests**
   1. Second request 409.

---

### T‑16.2  DST Scheduling Bug Guard (R‑2)

1. **Goal** Handle DST transitions.

2. **Sub‑goals**

   1. Use Luxon.
   2. Unit test around 2025‑03‑30 EU/Madrid.

3. **Files & Locations**

   ```tree
   /packages/core/src/utils/date.ts
   ```

4. **Minimal External Libraries**
   `pnpm add luxon`.

5. **Tests**
   1. Slot across DST skip doesn’t overlap.

---

### T‑16.3  Self‑Role Revocation Block (R‑4)

1. **Goal** Prevent last OrgOwner removal.

2. **Sub‑goals**

   1. DB constraint.
   2. Service check.

3. **Files & Locations**

   ```tree
   /infra/sql/003_self_role_block.sql
   /packages/engine/src/guards/roleIntegrity.ts
   ```

4. **Minimal External Libraries**
   None.

5. **Tests**
   1. Removal attempt 400.

---

## 17 · Final Acceptance Tests

### T‑17.1  Full Tournament Happy‑Path E2E

1. **Goal** Validate end‑to‑end flow.

2. **Sub‑goals**

   1. Organizer creates tourney.
   2. Teams register.
   3. Matches played.
   4. Champion shows.

3. **Files & Locations**

   ```tree
   /apps/mobile/tests/e2e/happyPath.spec.ts
   ```

4. **Minimal External Libraries**
   Reuse Cypress.

5. **Tests**
   1. All screens load.
   2. Logs in order.

---

### T‑17.2  Load & Resilience Testing

1. **Goal** Meet perf targets.

2. **Sub‑goals**

   1. Write k6 script.
   2. Run in CI nightly.

3. **Files & Locations**

   ```tree
   /tests/perf/k6-load.js
   ```

4. **Minimal External Libraries**
   External k6.

5. **Tests**
   1. P95 ≤200 ms.

---

## 18 · Documentation & Onboarding

### T‑18.1  Developer Handbook

1. **Goal** Quickstart docs.

2. **Sub‑goals**

   1. Setup instructions.
   2. Coding standards.

3. **Files & Locations**

   ```tree
   /docs/DEVELOPER_HANDBOOK.md
   ```

4. **Minimal External Libraries**
   None.

5. **Tests**
   1. Markdown lint passes.

---

### T‑18.2  Plugin Authoring Guide

1. **Goal** Teach external devs.

2. **Sub‑goals**

   1. Lifecycle docs.
   2. Conformance harness usage.

3. **Files & Locations**

   ```tree
   /docs/PLUGIN_GUIDE.md
   ```

4. **Minimal External Libraries**
   None.

5. **Tests**
   1. Example plugin passes harness.

---

🎉 **Catalogue complete — 85 tasks, each with paths, minimal deps, expanded sub‑goals, and tests.**

### T‑18.3  Architecture Decision Records

1. **Goal** Record key technical decisions with context.

2. **Sub‑goals**

   1. Create `/docs/adr/0001-record-architecture.md` template.
   2. Add ADR check‑list in PR description.

3. **Files & Locations**

   ```tree
   /docs/adr/
   ```

4. **Minimal External Libraries**
   `pnpm add -D adr-tools` optional

5. **Tests**

   1. `pnpm adr new` generates new ADR file.

---

### T‑18.4  License & Contributor Agreement

1. **Goal** Clear OSS licensing and contributor terms.

2. **Sub‑goals**

   1. Add `LICENSE` file (MIT).
   2. Add `CONTRIBUTOR_LICENSE_AGREEMENT.md`.

3. **Files & Locations**

   ```tree
   /LICENSE
   /CONTRIBUTOR_LICENSE_AGREEMENT.md
   ```

4. **Minimal External Libraries**
   None

5. **Tests**

   1. Repository license displays correctly on GitHub.

---

### T‑18.5  Issue & Project Board Templates

1. **Goal** Standardised triage and planning workflow.

2. **Sub‑goals**

   1. Add GitHub Issue templates (bug, feature, question).
   2. Configure GitHub Project board automation.

3. **Files & Locations**

   ```tree
   /.github/ISSUE_TEMPLATE/
   /.github/project.yml
   ```

4. **Minimal External Libraries**
   None

5. **Tests**

   1. Creating new issue uses template.

---
