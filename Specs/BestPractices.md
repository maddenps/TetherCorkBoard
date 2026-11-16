# Best Practices & Preferences

Guidelines specific to this codebase. Read `ProjectArchitecture.md` first for structural context.

---

## Architecture rules

### Where new code goes
- **Geometry, hierarchy, board mutations** → pure functions in `src/lib/board.ts`. No React, no DOM, so they can be tested.
- **Persistence** → `src/lib/storage.ts` and `src/lib/useBoards.ts` only. Components never touch IndexedDB.
- **UI** → a component in `src/components/`. Keep `Board.tsx` for camera and gestures; new panels or overlays get their own file.
- **Types** → `src/lib/types.ts`.
- **Page files** stay thin.

### Client components
This app is a client-side tool; nearly everything is `"use client"`. Keep `layout.tsx` and `page.tsx` server components that only compose.

---

## Offline and data safety

- No runtime network calls. No CDN fonts, scripts or images.
- No API routes, server actions or middleware: the app is a static export.
- Never lose user data silently. Old boards and exports must keep loading after a model change: default missing fields on load.
- Imported files and stored records are untrusted. Validate, then fall back.
- Use `uid()` from `lib/board.ts`, not `crypto.randomUUID()`.
- Wrap `localStorage` access in `try/catch`; it can throw in private mode.

## Touch and performance

- Every interaction must work with one finger or a pinch. Do not rely on hover or right-click.
- Pointer handlers must not allocate heavily per move event; the board can hold hundreds of items.
- Keep the world layer to one CSS transform. Do not re-layout items to zoom.
- Large boards: if rendering slows down, cull items outside the viewport before reaching for a canvas rewrite.

## Code style

- TypeScript strict. No `any`; narrow `unknown` instead.
- Name things for the domain: item, section, string, pin, board, view.
- Reuse before writing. No abstractions for one use.
- No dead code, no stray TODO comments, no `console.log`. Follow-ups go in `Specs/TODO.md`.
- Swallowed errors (`catch {}`) need a comment saying why that is safe.

## Dependencies

Keep the dependency list tiny (currently only Next, React, Tailwind). Adding a package needs a reason the platform cannot meet, and it must work offline and be bundled.
