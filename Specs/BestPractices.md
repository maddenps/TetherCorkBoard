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

## Performance (keep the board snappy)

Measured on the 120-item Bishop board in the dev build: a React update used to cost 140 to 180ms (up to 490ms) because every card re-rendered; with the rules below it is about 25ms. Keep to these:

- **Move the camera on the page, not through React.** `moveCamera` / `applyCamera` in `Board.tsx` set the world layer's transform directly each frame; React's `view` is updated at most every 90ms (and at once when a zoom level changes). Never call `setView` directly; read the live camera from `camRef` in event handlers.
- **`ItemCard` is `memo`ized.** Pass it only primitives, stable objects and stable callbacks (`stableFit`, `openPhotos` are `useCallback`s). A new inline function or object prop re-renders every card on every update.
- **Only cards near the screen are rendered** (`rendered` in `Board.tsx`: the screen plus a margin of one screen on every side; the selected item and the one with its card open always render). Strings are still drawn from the data, so an off-screen end does not break them.
- **Zoom-dependent text uses the `--s` CSS variable, which only changes on a commit and then only in about 8% steps**, not per frame; avoid anything that changes layout per frame. While a glide runs, React is not updated at all except when a zoom level or overview mode changes, and at the end.
- **The cork background is its own layer moved by a transform** (`corkRef`, `applyCamera`), not a background on the board: repainting a full-screen background every frame is slow. Its grain size changes only on a commit.
- **Shadows:** cards use a `drop-shadow` filter (it follows the snipped corner), which is costly to compose; below the overview zoom (38%) they use a plain `box-shadow` instead. Cards also carry `contain: layout style`.
- **Judge speed on a production build** (`npm run build`, then serve `out/`), not the dev server: dev React renders everything twice (StrictMode) and is several times slower.
- Expensive things to be careful with on every card: `filter: drop-shadow`, `clip-path`, large `box-shadow`s and images. If a board needs thousands of items, see the TODO about drawing the zoomed-out view on a canvas.
