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
  trip can read as places, then groups, then notes (what each level means is set by item types and packs)
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
    globals.css         Tailwind import, chrome design tokens (@theme), drawer and paper-detail styles, edit-card animations
  components/
    Workspace.tsx       owns the boards, the menu drawer, the types dialog and import / export; renders Board full screen
    MenuDrawer.tsx      left drawer: boards, this board (rename, backup, open), look (theme, surface), types, help, delete
    AddDrawer.tsx       right drawer: add section / note / photo / pin and items from your types
    TopBar.tsx          the one floating bar: menu, board name, search, Add
    ZoomControls.tsx    bottom-right zoom and level badge with Up, zoom in, zoom out, fit all
    ui/                 chrome building blocks: Drawer, Segmented, icons (inline SVG), styles (shared class strings), useEscape
    SearchPanel.tsx     search the board; drops down under the top bar
    TypesEditor.tsx     item types and packs dialog (bottom sheet on phones)
    Board.tsx           camera (pan, zoom), gestures, add items, selection, string mode
    ItemCard.tsx        one item on the board (section, note, photo)
    ItemPopover.tsx     edit card that pops out beside the selected item and follows it
    ResizeHandles.tsx   grips on the selected item: four corners, four edges, a Move handle and a Settings button
    Strings.tsx         SVG layer drawing the strings
    Breadcrumb.tsx      path along the top (All > section > section); tap a step to zoom out to it
    PhotoViewer.tsx     modal stack of an item's photos (arrows, thumbnails, Esc closes)
    GestureHint.tsx     dismissible reminder of click / right-click / Esc (dismissal kept in localStorage)
    ServiceWorkerRegister.tsx
  lib/
    types.ts            Board, Item, Link, View, BoardExport
    board.ts            pure helpers: depth, thresholds, fit view, move, reparent, delete
    storage.ts          IndexedDB load / save / delete
    useBoards.ts        all boards in memory, debounced autosave, current board id
    seed.ts             demo board and empty board factories
    packs.ts            type packs: parsePack (validates untrusted JSON), mergePack (adds types, never overwrites), makePack, built-in packs
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
  examples/             ready-made boards to import (research-web.cork.json: a linked web of ideas, with the Research web types embedded)
  packs/                shareable type packs (*.cork-pack.json), e.g. climbing.cork-pack.json; format {format:"tethercorkpack", version:1, name, description?, types[]}
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
(0, 0, 0.3, 0.9, 1.6): the first two levels, areas and the things inside them, are always shown. Hidden items fade out and stop receiving pointer events. Strings are drawn only when
both ends are visible. A section whose children are hidden shows a large title and "N inside, zoom in"; once
children are visible it shrinks to a header and its body lets pans pass through.

Notes grow in height until all of their text and field lines fit (`ItemCard` measures its content and calls `Board.fitNote`; they never shrink on their own, and you can still resize bigger).

Double-click an item (or "Zoom to" in the panel) animates the camera to it. How much of the screen it fills depends on its size (`viewFor` in `Board`): about 35-40% for small notes, rising to about 92% for big sections and maps. Cards are drawn untilted at `STRAIGHT_SCALE` (0.3, where route notes appear) and above, because a tilted card is resampled by the compositor and its text goes soft. `Board` works out what the camera is "in" (the deepest visible item under the middle of the screen that fills half the view); that drives the breadcrumb, the Up button and where `+ Note` etc. add new items.

## 5. Gestures (`Board.tsx`)

| Input | Result |
|---|---|
| Drag empty board | Pan |
| Wheel / trackpad scroll | Zoom around the cursor |
| Two-finger pinch | Zoom and pan |
| Drag an item (or a section header) | Move it and everything inside it; on drop it joins the smallest section under its centre |
| Double-click / double-tap an item (any part, including the body of an open section) | Zoom in to it by at most 50 percentage points of zoom (25% to 75%, 45% to 95%, 100% to 150%; double-click again to go further), with an eased glide; a single click does nothing (a pin zooms to the section it points at). Hit-tested by position, so it works at any zoom |
| Click the 🔗 icon on a card | Opens the item's link in a new tab (real `<a>`, `noopener`; only http(s) via `safeUrl`) |
| Click the 🖼️ icon on a card | Opens the photo stack for that note or section (`Item.photos`, added from "Add photos…" in the edit card) |
| Drag the red pin (thumbtack) on an item | Moves where the pin and any string tied to the item sit (`Item.pin`, fractions of the item's size; "Reset pin" in the edit card). A click on the pin without moving counts as a click on the item |
| Right-click, or press and hold (touch) | Select the item under the pointer: shows resize grips, a Move handle and a Settings button (the edit card does not open by itself) |
| Press the Settings button on the selected item | Pop the edit card out beside it; Done or Esc closes the card, Esc again deselects |
| Drag the Move handle on the selected item | Move it (and what is inside it) without needing to grab a particular part of it |
| Esc, the Up button, or double-click on the bare board | Out one level (edit card closes first if open) |
| Breadcrumb step | Zoom out to that step; All fits the whole board |
| Drag a corner grip (both ways) or an edge grip (one way) on the selected item | Resize (min 90x60). Edge grips only show when that edge is at least 120px long on screen. Resizing by hand turns `autoFit` off |
| Tick "Auto-fit size to its content" in the edit card | `Item.autoFit`: a note's height follows its text (grows and shrinks, +14px spare); a section grows and shrinks around its children (+32px spare right and bottom; sections with a map image only grow). Pure helpers `fitSectionSize` / `autoFitSections` in `lib/board.ts` |
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
