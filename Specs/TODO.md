# TODO

Priority: [H] High · [M] Medium · [L] Low

---

## In Progress

_(nothing currently)_

---

## Foundation (2026-11-16)

- [x] [H] Paper look (sticky notes, polaroid photos, sections with a red margin line), corner resize, popover edit card, double-click to select and zoom, light/dark theme (dark default) — 2026-11-16, resize checked in browser, touch not yet

- [x] [M] Whiteboard view (marker outlines, magnet photos) — 2026-11-17, typechecked, browser check below
- [x] [H] Project scaffold: Next 16 static export, Tailwind 4, TypeScript, docs
- [x] [H] Board with pan, zoom, pinch, items, strings, semantic zoom, demo board
- [x] [H] IndexedDB persistence with autosave, JSON export and import
- [x] [H] Service worker + manifest for offline use
- [ ] [H] Verify in a real browser: gestures on a phone, offline after first load, install to home screen
- [ ] [M] PNG icons (192, 512, maskable) for reliable Android and iOS install
- [ ] [M] Replace arbitrary Tailwind values in components with `@theme` tokens (AGENTS.md rule)

## Layout and content (brainstormed 2026-11-17)

Goal: build a good-looking trip board easily, e.g. top level = area map, a section per location (and the Airbnb), then a map per area, a section per boulder, then routes with photos and video links, and quick search for a route name.

Chosen as the priority set (the first five):

- [x] [H] Maps as section backgrounds: a section can take a picture (area map, topo, screenshot) as its backdrop with its contents sitting on top. Maps are saved images, so it works offline — 2026-11-17, set from the section's edit card, section takes the picture's shape; browser-checked. Not yet: pinch-zoomed map detail limit is 2400px, no PDF import
- [x] [H] Custom item types designed in the app (not hardcoded) — 2026-11-17, Types button in the top bar (name, note/section, colour, fields with up/down/delete), `+ Type` menu on the board, type picker and field editors in the edit card; browser-checked. Not yet: showing a field's value on sections, tags field type.
  Original ask: define a type with a name, colour/look and its own fields (text, number, link, tags, status, checkbox); pick a type when adding an item; edit a type later and existing items keep their values. Ship Area, Location, Boulder and Route as editable starter types. Keep the `Board` shape backward compatible (see AGENTS.md rule 6)
- [x] [H] Link field on any item (done 2026-11-17: Link box on every card, only http(s) opens, 🔗 badge on the item, "needs signal" hint offline; thumbnail-as-stand-in not done): URLs (e.g. YouTube) shown as a chip that opens in a new tab, with a "needs signal" hint when offline; a thumbnail photo can stand in so something shows with no signal
- [x] [H] Search (done 2026-11-17: 🔍 Search on the board, title/notes/link/type/field matching, shows the path, Enter or tap zooms and selects, offline): top-bar box over titles, notes, link text and custom fields; works offline; tapping a result zooms to the item and shows its path ("Pine Ridge › Mossy Wall › Warm-up slab"). Replaces the older "Search items" entry below
- [x] [H] Custom pins and connectors (done 2026-11-17: + Pin, emoji and colour, "Points to" draws a connector; connectors have String / Line / Dashed / Arrow style, colour and label; browser-checked, touch not yet): a section can be tied to a spot on a map with its own pin (position, icon, colour, label) instead of being placed directly on top of the map; connectors from a pin to its section, with style, colour and label options. The pin shows at the map's zoom level and the section opens as you zoom in. Extends the string/pin work in "Board features" (labels, colours)

Other ideas from the same brainstorm:

- [ ] [M] Tidy button: arrange a section's contents in a grid or row and resize the section to fit; snapping and alignment guides while dragging
- [ ] [M] Starter templates: "New trip" creates a skeleton (Airbnb, a few areas, pre-sized sections for boulders)
- [ ] [M] Draw on photos: trace route lines over a boulder photo in a colour and number them
- [ ] [M] Breadcrumb path along the top and an "up a level" button (also listed under Board features)
- [ ] [M] Tags and status per item (grade, done / project / todo, colour by status) with search filters ("all V4 projects"); builds on the custom field types
- [ ] [L] Multi-select and copy/paste of whole sections (also listed under Board features)
- [ ] [L] Export a level as an image or PDF to share
- [ ] [L] Mini-map (also listed under Board features)
- [ ] [L] Map pin with GPS coordinates and "open in maps" (see "Item locations" below)

## Board features

- [ ] [H] Undo / redo
- [x] [M] String labels ("20 min drive") and colours — 2026-11-17, part of connectors
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
- [x] [M] Validate and migrate imported or stored boards (defaults for missing fields) — 2026-11-17, `normalizeBoard` in `lib/model.ts`, used on load and import; still needs tests once Vitest is in
- [ ] [L] Error boundary around the board
- [ ] [L] Optional sync between devices (only if it can stay offline-first)

## Quality

- [ ] [M] Add Vitest and tests for `lib/board.ts` (depths, reparent, delete, fit)
- [ ] [L] Playwright smoke test (load demo board, zoom reveals routes)
- [ ] [L] Dockerfile / deploy pipeline once a host is chosen (static hosting is enough)
