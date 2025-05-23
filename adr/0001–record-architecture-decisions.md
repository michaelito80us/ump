# 0001 – Record architecture decisions

**Status**: Accepted
**Date**: 2025‑05‑23

## Context

As the codebase grows, the reasoning behind key choices (e.g. “Why a PWA instead of native?”, “Why Tailwind?”) can disappear in chat threads or commit messages. An Architecture Decision Record (ADR) log gives us a lightweight chronological narrative so future contributors (and our own future selves) can understand _why_ things are the way they are.

## Decision

1. **Adopt the ADR pattern** as described by Michael Nygard.
2. **Store ADRs under `/adr/`** at the repository root, named **`NNNN‑title.md`**, where **`NNNN`** is a zero‑padded sequence.
3. **Use `adr-tools` (bash)** to generate new ADR templates so headings stay consistent.
4. **Treat ADRs as immutable once “Accepted”** – later changes require a superseding ADR rather than editing history.
5. **Reference ADR IDs** in commit messages, PR descriptions, and relevant docs.

## Consequences

- **Traceability** – every major choice has a permalink and date.
- **On‑boarding speed** – new collaborators can skim the `/adr/` folder to grok rationale.
- **Slight overhead** – writing an ADR (\~5 min) becomes part of the definition‑of‑done for significant changes.

## How to create a new ADR

```bash
# one-off install (dev dependency)
pnpm add -D adr-tools

# helper wrapper (optional) – save as scripts/adr.sh
#!/usr/bin/env bash
adr new "$@"

# create ADR 0002
./scripts/adr.sh "choose postgres"
```

The first line of every ADR should start with its sequence number and concise title, followed by **Status**, **Date**, and the standard sections: Context → Decision → Consequences.
