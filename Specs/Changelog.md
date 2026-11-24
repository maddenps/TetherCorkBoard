# Changelog

Newest first.

## 2026-11-24

- New app chrome: the header and floating buttons are replaced by one floating top bar (menu, board name, search, Add), a left menu drawer (boards, backup and import, theme and board surface, item types and packs, gesture tips, delete) and a right Add drawer, plus a vertical zoom and Up pill and a breadcrumb under the bar. A new "paper and thread" visual style (warm paper surfaces, brown ink, one thread red accent, one UI font, one corner radius, inline SVG icons) with design tokens in `globals.css` and the full rules in `Specs/StyleGuide.md`. The settings card goes two columns wide instead of scrolling when it is too tall, the search panel slides out from under the top bar, and the drawers swing in with every part finishing together. Panels can be held to the board by paper tape, a paper clip, a staple, a pushpin or a binder clip (menu: Office supplies on panels: Always, Sometimes, Off). Floating panels have a folded dog-ear corner, drawers have a torn-paper inner edge (rough noise-built edge with a pale fibre rim), the current breadcrumb step has a hand-drawn marker underline, and a few notes and sections on the board occasionally wear tape or a paper clip too. The whiteboard surface is switched off for now. When zoomed out, note and section titles, map pins, string lines and string labels now grow to stay readable (about 11px or more on screen) and notes show only their title below 45% zoom. The drawers' torn edge runs the full height. Cards no longer tilt (it blurred note titles), notes show their details from 38% zoom, a double-click zooms in by at most 50 percentage points of zoom (25% to 75%, 45% to 95%), and every camera move eases in and out frame by frame. Safe-area aware for phones; framing the camera now leaves room under the bar.

## 2026-11-17

- Trip-planning features: map images behind sections; custom item types designed in the app (Types button, `+ Type` menu, starter types such as Area / Location / Stay / Boulder / Route, since replaced by general starter types and loadable packs); a Link field on every item (http(s) only); search across titles, notes, links and fields with the section path, jumping and zooming to the result; map pins (emoji, colour, "Points to"); and connectors with string / line / dashed / arrow styles, colours and labels. Boards from before this load with the starter types added, and stored and imported boards are now validated (`normalizeBoard`).

- Whiteboard background (later pass): the old marks are now faded tables, bulleted lists, flow charts, circled notes with arrows and ruled lines that an eraser mostly took back out, on a 2048px tile so they repeat far less often.
- Whiteboard polish: the surface is generated with eraser smears, ghosts of old marker lines and dust (`lib/whiteboard.ts`), and item outlines are wobbly hand-drawn marker strokes that bow, lean, round the corners unevenly and overshoot where they close (`lib/marker.ts`). (Tuned back the same day: no scribbled-word ghosts, no retrace double line, outlines less wild.)

- Whiteboard view, switched from the top bar (remembered per device, not saved in boards). Notes and sections are marker outlines (paper colour becomes marker colour), photos are held on with clear dome magnets, strings are drawn marker lines. The cork board is unchanged.

## 2026-11-16

- Notes are sticky notes, photos are polaroids, sections are paper with a red margin line. Items resize from corner grips. The edit card pops out beside the selected item. Double-click selects and zooms to any item at any zoom. Light and dark theme (dark by default). Cork background is generated in the browser.
- Initial scaffold: static Next.js app with a zoomable cork board, notes, photos, sections, string, semantic zoom, offline storage and service worker, JSON export and import, and the `Specs/` docs plus `AGENTS.md`.
