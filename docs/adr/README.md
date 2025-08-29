# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for the UMP project.

## What are ADRs?

Architecture Decision Records (ADRs) are short text documents that capture important architectural decisions made during the project, along with their context and consequences.

## Quick Start

### Creating a New ADR

1. **Determine the next number**: Look at existing ADRs and use the next sequential number
2. **Create the file**: `NNNN-descriptive-title.md` (e.g., `0002-choose-database-technology.md`)
3. **Use the template**: Copy the structure from ADR-0001 or use the template below
4. **Fill in the content**: Provide context, decision, and consequences
5. **Submit for review**: Include in your pull request

### ADR Template

```markdown
# ADR-XXXX: [Title]

## Status

[Proposed | Accepted | Deprecated | Superseded by ADR-YYYY]

## Context

[Describe the situation and forces at play]

## Decision

[Describe the chosen solution]

## Consequences

[Describe the positive, negative, and neutral consequences]

---

**Date**: YYYY-MM-DD  
**Author**: [Your Name]  
**Reviewers**: [Reviewer Names]  
**Related Issues**: [GitHub issue numbers or task IDs]
```

## When to Write an ADR

Create an ADR for decisions that:

- ✅ Affect system architecture or structure
- ✅ Impact multiple teams or components
- ✅ Have long-term implications
- ✅ Involve significant trade-offs
- ✅ Establish important conventions
- ✅ Address non-functional requirements

## Current ADRs

| Number                                          | Title                         | Status   | Date       |
| ----------------------------------------------- | ----------------------------- | -------- | ---------- |
| [0001](./0001-record-architecture-decisions.md) | Record Architecture Decisions | Accepted | 2025-01-24 |

## ADR Statuses

- **Proposed**: Under discussion, not yet decided
- **Accepted**: Decision made and being implemented
- **Deprecated**: No longer recommended but still valid
- **Superseded**: Replaced by a newer ADR

## Tools

### Manual Process

Simply create markdown files following the naming convention and template.

### Using adr-tools (Optional)

If you have `adr-tools` installed:

```bash
# Install adr-tools (optional)
npm install -g adr-tools

# Create a new ADR
adr new "Choose Database Technology"

# List all ADRs
adr list

# Generate table of contents
adr generate toc
```

### Using pnpm Scripts

```bash
# Create new ADR (if adr-tools is installed)
pnpm adr new "Decision Title"

# List ADRs
pnpm adr list
```

## Best Practices

### Writing Guidelines

1. **Be Concise**: ADRs should be short and focused
2. **Be Specific**: Include concrete details and examples
3. **Be Honest**: Document both positive and negative consequences
4. **Be Timely**: Write ADRs close to when decisions are made
5. **Be Collaborative**: Involve relevant stakeholders in the process

### Content Guidelines

- **Context**: Explain the problem and constraints
- **Alternatives**: Mention other options considered
- **Trade-offs**: Be explicit about what you're optimizing for
- **Implementation**: Include relevant technical details
- **Validation**: How will you know if the decision was right?

### Process Guidelines

- **Review**: Include ADRs in code review process
- **Reference**: Link to ADRs from code and documentation
- **Update**: Mark ADRs as deprecated/superseded when needed
- **Archive**: Keep old ADRs for historical context

## Integration with Development

### Pull Request Checklist

When submitting PRs that involve architectural decisions:

- [ ] Is this change architecturally significant?
- [ ] Have I created or updated relevant ADRs?
- [ ] Have I referenced existing ADRs that apply?
- [ ] Have I included ADR reviewers in the PR?

### Code Comments

Reference ADRs in code when implementing complex decisions:

```typescript
// Implementation follows ADR-0003: Plugin Sandbox Architecture
// See: docs/adr/0003-plugin-sandbox-architecture.md
const sandbox = new VM2Sandbox({
  timeout: 5000,
  sandbox: { ctx: pluginContext },
});
```

## Examples from Other Projects

- [Spotify ADRs](https://github.com/spotify/web-api/tree/master/documentation/adr)
- [Shopify ADRs](https://github.com/Shopify/web-foundation/tree/main/documentation/adr)
- [ADR Examples](https://github.com/joelparkerhenderson/architecture-decision-record/tree/main/examples)

## Resources

- [ADR-0001: Record Architecture Decisions](./0001-record-architecture-decisions.md) - Our ADR process
- [Michael Nygard's Original Article](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR GitHub Organization](https://adr.github.io/)
- [ThoughtWorks on Lightweight ADRs](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records)

---

**Need help?** Ask in the `#architecture` channel or mention `@architecture-team` in your PR.
