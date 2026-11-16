# TODO

Priority: [H] High · [M] Medium · [L] Low

---

## In Progress

_(nothing currently)_

---

## Foundation (2026-11-16)

- [x] [H] Paper look (sticky notes, polaroid photos, sections with a red margin line), corner resize, popover edit card, double-click to select and zoom, light/dark theme (dark default) — 2026-11-16, resize checked in browser, touch not yet

- [x] [H] Project scaffold: Next 16 static export, Tailwind 4, TypeScript, docs
- [x] [H] Board with pan, zoom, pinch, items, strings, semantic zoom, demo board
- [x] [H] IndexedDB persistence with autosave, JSON export and import
- [x] [H] Service worker + manifest for offline use
- [ ] [H] Verify in a real browser: gestures on a phone, offline after first load, install to home screen
- [ ] [M] PNG icons (192, 512, maskable) for reliable Android and iOS install
- [ ] [M] Replace arbitrary Tailwind values in components with `@theme` tokens (AGENTS.md rule)

## Board features

- [ ] [H] Undo / redo
- [ ] [M] String labels ("20 min drive") and colours
- [ ] [M] Per-board custom zoom thresholds, and a "levels" legend
- [ ] [M] Breadcrumb / "go up one level" button when zoomed into a section
- [ ] [M] Search items by title and jump to them
- [ ] [M] Checklist items and a "done" state (climbed it!)
- [ ] [L] Mini-map
- [ ] [L] Item locations (GPS coordinates) and open in maps
- [ ] [L] Multi-select and group move

## Data and offline

- [ ] [M] Store photos in a separate IndexedDB store instead of inline in the board record
- [ ] [M] Request persistent storage (`navigator.storage.persist()`) so the browser does not evict boards
- [ ] [M] "Update available" prompt when a new service worker is waiting
- [ ] [M] Validate and migrate imported or stored boards (defaults for missing fields)
- [ ] [L] Error boundary around the board
- [ ] [L] Optional sync between devices (only if it can stay offline-first)

## Quality

- [ ] [M] Add Vitest and tests for `lib/board.ts` (depths, reparent, delete, fit)
- [ ] [L] Playwright smoke test (load demo board, zoom reveals routes)
- [ ] [L] Dockerfile / deploy pipeline once a host is chosen (static hosting is enough)
