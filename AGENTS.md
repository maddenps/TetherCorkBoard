# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know

This version of Next.js has breaking changes: APIs, conventions and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Docs

All documentation lives in `Specs/` (index: `Specs/README.md`). Read `Specs/ProjectArchitecture.md` before searching for files, and keep `Specs/TODO.md` current.

## What this app is

Tether Cork Board is an offline-first, mobile-friendly web app for planning big projects in 2D space instead of a linear list: notes, photos and sections pinned to a zoomable cork board, joined with string. Zoom level reveals the hierarchy (area, then boulder, then route). It must keep working with **no signal**, so there is no server and no account: data lives in the browser (IndexedDB) and can be exported and imported as JSON.

## Offline-first rules (mandatory)

1. No runtime network dependency. Never fetch from a CDN, font host or API at runtime; bundle or self-host everything.
2. The site is a static export (`output: "export"`). Do not add API routes, server actions, middleware or anything needing a Node server.
3. All user data goes through `lib/storage.ts` (IndexedDB). `localStorage` only for tiny UI preferences, always in `try/catch`.
4. Use `uid()` from `lib/board.ts`, never bare `crypto.randomUUID()` (missing on plain-http pages such as a dev server opened from a phone).
5. Changing what the app shell needs to cache means bumping `VERSION` in `public/sw.js`.
6. Any change to the `Board` shape in `lib/types.ts` must keep old saved boards and old exports loading (default missing fields on load) and bump `BoardExport.version` only for breaking changes.

## Error handling: a bad board must never blank the page

- Treat imported JSON and stored boards as untrusted: validate shape, check `typeof`, fall back instead of throwing.
- Every `async` handler and effect has its own `try/catch` and shows a readable message. React does not catch those.
- Wrap anything that renders user data in an error boundary so one broken item cannot take the board down.
- A failed save must be visible and retryable, and must never discard the user's edits in memory.
- Every new failure path gets a test once a test runner exists.

## Commands

- `npm run dev` — dev server at http://localhost:3003 (service worker is disabled in dev)
- `npm run typecheck` — type-check (use this to verify code; avoid `npm run build` for routine checks)
- `npm run lint` — ESLint (core-web-vitals + typescript)
- `npm run build` — static export to `out/`; use only to test the offline/PWA build
- `npm run start` — serve `out/` locally (needs `npx serve`)
- `npm install` must be run with `--ignore-scripts` on this machine.

No test framework is configured yet.

## Architecture

Next.js 16 App Router (with `src/`), React 19, TypeScript, Tailwind CSS v4. Everything interactive is a client component; `app/page.tsx` is a thin shell.

- `src/app/` — layout, metadata, the single page
- `src/components/` — `Workspace` (board list, import/export), `Board` (camera, gestures, semantic zoom), `ItemCard`, `ItemPanel`, `Strings`
- `src/lib/` — `types.ts`, `board.ts` (pure geometry and hierarchy helpers), `storage.ts` (IndexedDB), `useBoards.ts` (state + autosave), `seed.ts`, `image.ts`
- `public/` — `sw.js` (offline cache), `manifest.webmanifest`, icons

Full map: `Specs/ProjectArchitecture.md`.

## Conventions

- Path alias `@/*` maps to `src/*`
- Package manager: npm
- Keep geometry and hierarchy logic as pure functions in `lib/board.ts` so it can be unit tested; components stay thin.
- Touch first: every interaction must work with one finger and with pinch; mouse and wheel are the secondary path. Tap targets at least 40px.

### Tailwind CSS

Use standard Tailwind utility classes. Do **not** use arbitrary values like `text-[14px]`, `w-[320px]`, `bg-[#fff]`. Use the built-in scale, or define a token in `globals.css` (`@theme`) and reference it. Values that are genuinely computed at runtime (item position, size, zoom transform, per-item colour) belong in the `style` prop, not in class names.

### Component structure

Small, single-purpose components. Pages compose components; big blocks of markup get their own file in `src/components/`.
