# Tether Cork Board: Architecture

> Keep this file current. When a file, data field, gesture or major component is added, update the relevant
> section in the same change. Last full audit against the code: 2026-11-16.

**Repo root:** `F:\Code-GIT\Other\TetherCorkBoard`
**Stack:** Next.js 16 (App Router, static export) · React 19 · TypeScript 5 · Tailwind v4 · IndexedDB · service worker
**Dev server:** `npm run dev` (port 3003). Type-check with `npm run typecheck`. Lint with `npm run lint`.

---

## 1. What the app does

A spatial planner. Instead of a linear outline, a project is laid out on a 2D cork board:

- **Items**: sections (containers), notes and photos, pinned anywhere on the board
- **Strings**: red string tied between two items (pin to pin)
- **Semantic zoom**: items belong to a parent section. Deeper levels only appear once you zoom in far enough, so a
  bouldering trip reads as areas, then boulders, then routes
- **Offline**: no server, no account. Boards are stored in the browser and the app shell is cached by a service
  worker, so it works with no cell signal after one visit online (or after installing it to the home screen)
- **Backup**: export a board to a `.cork.json` file and import it elsewhere

---

## 2. File map

```
src/
  app/
    layout.tsx          metadata, viewport, manifest link, registers the service worker
    page.tsx            renders <Workspace/>
    globals.css         Tailwind import, base styles
  components/
    Workspace.tsx       board picker, new / rename / delete, export / import
    Board.tsx           camera (pan, zoom), gestures, add items, selection, string mode
    ItemCard.tsx        one item on the board (section, note, photo)
    ItemPopover.tsx     edit card that pops out beside the selected item and follows it
    ResizeHandles.tsx   four corner grips on the selected item
    Strings.tsx         SVG layer drawing the strings
    ServiceWorkerRegister.tsx
  lib/
    types.ts            Board, Item, Link, View, BoardExport
    board.ts            pure helpers: depth, thresholds, fit view, move, reparent, delete
    storage.ts          IndexedDB load / save / delete
    useBoards.ts        all boards in memory, debounced autosave, current board id
    seed.ts             demo board and empty board factories
    image.ts            downscale picked photos to JPEG data URLs
    whiteboard.ts       generated whiteboard texture (smears, ghost lines, dust)
    marker.ts           pure wobbly marker-outline path generator
    model.ts            normalizeBoard (validates and defaults stored/imported boards), starter types, safeUrl, fieldSummary, pin/connector palettes
    search.ts           pure searchItems (title, notes, link, type, fields) with the section path
    online.ts           useOnline (for the "needs signal" hint on links)
    boardStyle.ts       useBoardStyle hook (cork or whiteboard view, localStorage)
    theme.ts            useTheme hook (light/dark, dark by default, class on <html>)
    theme-script.ts     pre-paint script so the theme never flashes
    cork.ts             paints the seamless cork background tile on a canvas at startup
public/
  sw.js                 offline cache (bump VERSION on shell changes)
  manifest.webmanifest  installable app manifest
  icon.svg
Specs/                  this documentation
```

---

## 3. Data model (`lib/types.ts`)

- `Board { id, name, items[], links[], view, updatedAt }`
- `Item { id, parentId, kind: section | note | image, x, y, w, h, title, text, color, imageData? }`
  - x, y, w, h are **world coordinates** (absolute, not relative to the parent)
  - `parentId` defines hierarchy and therefore zoom depth. A section's children are positioned over it
- `Link { id, from, to }` item ids
- `View { x, y, scale }` camera; `scale <= 0` means "never set, fit to content on first open"

Stored in IndexedDB database `tethercorkboard`, store `boards`, one record per board (photos inline as data
URLs). Exports wrap a board in `{ format: "tethercorkboard", version: 1, board }`.

---

## 4. Semantic zoom

`THRESHOLDS` in `lib/board.ts`: an item at depth `d` is visible when `view.scale >= THRESHOLDS[d]`
(0, 0.45, 0.9, 1.6, 2.6). Hidden items fade out and stop receiving pointer events. Strings are drawn only when
both ends are visible. A section whose children are hidden shows a large title and "N inside, zoom in"; once
children are visible it shrinks to a header and its body lets pans pass through.

Double-tap an item, or "Zoom to" in the panel, animates the camera to fit it.

## 5. Gestures (`Board.tsx`)

| Input | Result |
|---|---|
| Drag empty board | Pan |
| Wheel / trackpad scroll | Zoom around the cursor |
| Two-finger pinch | Zoom and pan |
| Drag an item (or a section header) | Move it and everything inside it; on drop it joins the smallest section under its centre |
| Tap an item (any part, including the body of an open section) | Select, pops the edit card out beside it |
| Double-tap / double-click an item | Select it and zoom to it (hit-tested by position, so it works at any zoom) |
| Drag a corner grip on the selected item | Resize (min 90x60) |
| "Tie string" then tap another item | Creates a string |

## 6. Offline

`next.config.ts` sets `output: "export"`, so `npm run build` produces static files in `out/`. `public/sw.js` caches
`/_next/static/*` cache-first and pages network-first with cache fallback. Registered only in production builds.
The first visit must be online. To test offline: build, serve `out/`, load once, then go offline in DevTools.

---

## 7. Known limits

- Photos are stored inside the board record, so photo-heavy boards get large. A separate blob store is a backlog item
- No sync between devices; use export and import
- No undo yet
