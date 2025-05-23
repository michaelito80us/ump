# Product Definition

**Version**: 0.1 – 2025‑05‑23

## Vision

A mobile‑first platform that lets sports enthusiasts set up tournaments extremely easily with possible advanced configurations, and lets the community discover and participate in them.

## Personas & Jobs‑to‑Be‑Done

### Organizer

- **Context**: Amateur league coaches, bar‑league captains, school sports admins.
- **JTBD**: "When I want to run a tournament, I want to create the schedule and keep everyone up‑to‑date without manual spreadsheets so that I can focus on the games, not admin."
- **Pains**: manual bracket crunching, constant status pings, last‑minute changes.
- **Gains**: frictionless creation, automated scheduling and notifications.

### Participant

- **Context**: Players who sign up individually or as a team.
- **JTBD**: "When I join a tournament, I want to know exactly when & where I play and track my progress so I can show up prepared and celebrate wins."
- **Pains**: finding tournaments, unclear schedule changes, missing score updates.
- **Gains**: one‑tap join, calendar sync, live standings.

### Spectator

- **Context**: Friends, family, fans curious about local events.
- **JTBD**: "When I hear about a tournament, I want to follow matches or attend in person so I can support my team."
- **Pains**: discovering events, fragmented info, unclear live status.
- **Gains**: browse map/list, real‑time scores, easy share.

## Key Acceptance Metrics

| Metric                                      | Target                             | Owner             |
| ------------------------------------------- | ---------------------------------- | ----------------- |
| Draft → Publish completion ratio            | ≥ 70 % of drafts reach “Published” | Organizer journey |
| Median time to complete draft               | ≤ 5 min                            | Organizer         |
| Successful join request rate                | ≥ 90 %                             | Participant       |
| Organizer median response time to join req. | ≤ 1 h                              | Organizer         |
| Spectator first meaningful paint            | ≤ 1,800 ms (PWA)                   | Front‑end         |
| p95 tournament list API latency             | ≤ 200 ms                           | Back‑end          |

## End‑to‑End Journey Outlines

_Detailed visual maps to be created in Figma and exported to `/docs/ux/journeys/`._

### Organizer happy‑path

1. Landing → “Create tournament”
2. Select sport + template
3. Configure bracket & dates
4. Invite participants / teams
5. Review & Publish
6. Live manage scores

### Participant happy‑path

1. Browse list / map
2. Open tournament detail
3. Request to join (solo / team)
4. Receive confirmation
5. View personal schedule
6. Report match result (if enabled)

### Spectator happy‑path

1. Discover via public list / share link
2. Follow tournament
3. View live bracket & scores
4. Share highlights

## Top Risks & Assumptions

| Persona     | Risk                                          | Mitigation                                           |
| ----------- | --------------------------------------------- | ---------------------------------------------------- |
| Organizer   | Drop‑off during draft if config feels complex | Offer “Quick‑start” template, progressive disclosure |
| Organizer   | Overload from join requests                   | Bulk accept/deny, smart defaults                     |
| Participant | Confusion on join flow vs. team creation      | Clear CTA copy, inline helper                        |
| Spectator   | Data cost on mobile for live updates          | Efficient polling, use Server‑sent events            |

## Links

- Figma board: _TBD_
- Journey PNG exports: `/docs/ux/journeys/`
