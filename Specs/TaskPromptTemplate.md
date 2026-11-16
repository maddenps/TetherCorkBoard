# Reusable Coding Prompt: Tether Cork Board

> Paste this block at the start of any coding session, then add your specific task at the bottom.
> Attach `ProjectArchitecture.md` and `BestPractices.md` as additional context.

---

## CONTEXT

You are working in **Tether Cork Board**, an offline-first, touch-friendly Next.js 16 (static export) + React 19 + TypeScript + Tailwind v4 app for planning projects on a zoomable 2D cork board with notes, photos, sections and string. The authoritative map of the codebase is `Specs/ProjectArchitecture.md`. Read it before searching for files. Code rules are in `Specs/BestPractices.md`; read `AGENTS.md` for the offline and error-handling rules.

Key facts:
- No server: no API routes, no runtime network calls, data in IndexedDB via `lib/storage.ts`
- Geometry and hierarchy logic are pure functions in `lib/board.ts`
- Semantic zoom is driven by `THRESHOLDS`; hierarchy comes from `parentId`
- It must work with one finger on a phone with no signal
- Next.js here differs from your training data: check `node_modules/next/dist/docs/` before Next-specific code

---

## OPERATING PRINCIPLES

1. **Read the architecture first.** Don't invent paths or duplicate helpers.
2. **Best solution, not fastest.** Fix root causes; explain trade-offs briefly.
3. **Reuse before writing.**
4. **No gold-plating.** No handling of impossible cases, no abstractions for one use.
5. **Match the house style.** Neighbouring files first; no new dependencies without a clear need.
6. **Protect user data.** Old boards and exports must keep loading.
7. **No dead code, no stray TODOs.** Put follow-ups in your reply or `Specs/TODO.md`.

---

## DEFINITION OF DONE

- [ ] Implemented in the right layer (pure helper / hook / component)
- [ ] `npm run typecheck` and `npm run lint` pass
- [ ] Works by touch (one finger, pinch) and by mouse
- [ ] No runtime network use added; offline still works
- [ ] Stored-data or export shape changes stay backward compatible
- [ ] `Specs/ProjectArchitecture.md` and `Specs/TODO.md` updated; entry added to `Specs/Changelog.md`
- [ ] Reply summarises what changed, why, and what was deliberately left out

---

## ANTI-PATTERNS TO REJECT

- Fetching from a CDN, font host or API at runtime
- API routes, server actions or middleware
- `crypto.randomUUID()` directly
- Unguarded `localStorage`
- Arbitrary Tailwind values
- Hover-only or right-click-only interactions
- Swallowed errors

---

## TASK

<!-- Replace with your request: what the user sees, where it lives (component / helper), constraints.

Example: Add an "Undo" button to the floating controls. Keep the last 20 board states in memory
(not persisted), restore the previous one on tap, and clear history when switching boards. -->
