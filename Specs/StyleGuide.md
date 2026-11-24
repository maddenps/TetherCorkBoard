# Style Guide

Visual rules for new UI. See `BestPractices.md` for code rules.

---

## Stack

- **Tailwind v4**, tokens in `src/app/globals.css` under `@theme`
- No arbitrary Tailwind values (`w-[320px]`, `bg-[#fff]`). Use the scale or define a token
- Runtime-computed values (item position and size, camera transform, per-item colour) go in the `style` prop
- No icon or font libraries; the system font stack for all chrome (handwriting only for item titles on the board), and inline SVG icons from `components/ui/icons.tsx`. Everything must be bundled for offline

## The board

- Background: cork texture painted once at startup by `lib/cork.ts` (seamless 768px tile: tan mottling, fine grain, dark and light granules). It pans with the camera and zooms gently. No image download
- Paper colours for notes: yellow, pink, green, blue, lilac, white (`PAPER_COLORS` in `lib/board.ts`)
- Sections: opaque tinted paper with a red margin line (no ruled lines), handwriting-style title that shrinks to a header when zoomed in
- Notes: sticky notes with a snipped, folded corner and a slight random tilt. Photos: white polaroid frame with caption. All have a drop shadow and a red pin at top centre
- Strings: red (`#b91c1c`), 4 world px wide, slight sag, faint offset shadow
- Selection: sky-blue ring. String target: red ring

## Chrome design system: "paper and thread"

The chrome is everything that is not the board: the top bar, the two drawers, dialogs, search, the zoom controls and the hint. It is styled as **paper stock pinned to the cork, held by red thread**: warm cream cards with a hairline edge and a soft drop shadow, dark warm-brown ink, and the same red as the board's string for the one thing that matters on each screen. It should feel like part of the cork board, not a generic app laid over it.

Everything below is the source of truth. When you add or change UI, take colours, shapes and class strings from here and from `src/components/ui/`; do not invent new ones.

### Tokens (`src/app/globals.css`)

Colours are CSS variables that change with the theme, mapped to Tailwind with `@theme inline`, so chrome never needs `dark:` variants: write `bg-paper text-ink` and it follows the theme.

| Token (class suffix) | Light | Dark | Use |
|---|---|---|---|
| `paper` | #fbf7ee | #2b251f | Main surface of bars, drawers, dialogs, panels |
| `paper-2` | #f3ecdb | #352e27 | Hover, tiles, inputs, field cards sitting on paper |
| `paper-3` | #e8dec6 | #40382f | Pressed state, inset wells (segmented control track) |
| `ink` | #2a2118 | #f4ecdc | Primary text and icons |
| `ink-soft` | #6a5b49 | #bcad93 | Secondary text, hints, inactive controls |
| `ink-faint` | #9a8b75 | #8d7f69 | Group labels, placeholders, tiny captions |
| `line` | #e2d6bb | #4b4236 | Hairline borders and dividers |
| `thread` | #b91c1c | #ef6b5b | The accent: primary button, current board, active crumb, pin head |
| `thread-deep` | #991b1b | #d9534a | Hover on thread |
| `on-thread` | #fff8ee | #2b1410 | Text and icons on a thread-coloured fill |
| `focus` | #0ea5e9 | #38bdf8 | Keyboard focus ring only |

Rules: the board's own colours (cork, note paper, string, the sky-blue selection frame) are **not** chrome tokens and do not change with the theme. Use `ink/45` style opacity modifiers for scrims. Never use raw hex, `stone-*`, `zinc-*` or `dark:` in chrome.

### Typography

- **One UI font**: the system sans stack (`--font-sans` in `globals.css`, set on `html`) for **all** chrome, including titles. The handwriting stack (`HAND` in `ItemCard.tsx`) is for items on the board only (note and section titles) and must never appear in the chrome.
- Scale (use only these): drawer and dialog titles `text-xl font-bold`; board name `text-base font-bold`; buttons and rows `text-sm font-semibold` (rows may be `font-medium`); body text and inputs `text-base`; hints and secondary lines `text-sm text-ink-soft`; captions and group labels `text-xs`.
- **Group label**: `text-xs font-bold uppercase tracking-widest text-ink-faint` (`groupLabel`).

### Shape, depth and motion

- **One corner radius for everything**: `rounded-ui` (0.625rem, token `--radius-ui`) on every button, icon button, chip, input, list row, tile, bar, panel, drawer edge, dialog, segmented control and the edit card. The only exception is `rounded-ui-sm` (0.375rem, `--radius-ui-sm`) for something nested inside a padded `rounded-ui` container (segmented options, the icon square inside a tile, colour swatches, thumbnails). Never use `rounded-sm`, `-md`, `-lg`, `-xl` or `-full` on chrome. Circles are only for things that are literally dots or badges (the pin-head dot, photo count and remove badges, pin and connector colour swatches). Notes and sections on the board keep their own paper look and are not chrome.
- Depth: `shadow-paper` for anything resting on the board (bar, chips, tiles, pills); `shadow-lift` for things that float above it (drawers, dialogs). One hairline `border-line` on every surface.
- **Fasteners** (office supplies holding a panel to the board; `ui/Fastener.tsx`, choice and look generated by `lib/fasteners.ts`, `.tape` and `.fastener` in `globals.css`): the one decoration the chrome has. Kinds: **paper tape** (translucent strip, kraft, pink or blue, faint sheen), **paper clip** (a steel gem clip clipped onto the panel's top edge the way it sits on a page: the top loop is above the edge and below it the paper slides between the two wires, so only one wire loop shows, the outer or the inner, and the other goes behind the paper; drawn in `PaperClip`), **staple** (silver, lying diagonally across the top-left corner; menus and panels only, never on the cork board), **pushpin** (red, blue or yellow head with a highlight, like the pins on the board) and **binder clip** (black with a silver handle). Which kinds may appear depends on the spot (`KINDS_AT`): top-left tape, clip, staple or pin; top-centre tape, pin or binder; top-right tape or clip; bottom-right tape. **Staples are top-left only.** Used on: the gesture hint (top-left), the search panel (bottom-right), the types dialog (top-centre, and sometimes a staple or clip top-left), the photo viewer print (top-centre) and the Add tiles (small, top-left). Also: and **a few notes and sections on the board** only occasionally wear tape or a paper clip at the top-left (`rare`: even in Always mode about 1 note in 10 and 1 section in 5, by chance, the same ones every time since the look comes from the item's id; drawn 1.2x and 1.8x bigger). Pushpins on sections (4 corners on big ones, 2 on top for medium ones) were tried and taken out: too big, and they covered things in the corners. **No staples on the board, ever.** None of this appears in whiteboard view or on photos or pins. Rules: at most one per spot, on an edge or corner, never over text or a control, never on bars or drawers, no clicks, drawn with inline SVG (no images). Look: kind, colour, angle (2 to 6deg either way), tape length and a small nudge come from a hash of the panel's name, the visit number and a per-page-load salt: repeatable within a visit, different between panels, openings and page loads (no `Math.random` during render). **Setting** (menu, Look, "Office supplies on panels"; `tether-tape-mode` in localStorage, per device): Always, **Sometimes** (the default: each panel has its own chance, decided again each time it opens) or Off. To add one to a panel: make it `relative`, drop in `<Fastener id="unique-name" visit={n} at="top-left" chance={0.6} />`, and pass a `visit` that changes each time the panel opens (`useVisit()` for panels that mount when opened, or count opens for panels that stay mounted). To add a new kind, draw it in `Art` and add its size and spot rules. Drawers have no vertical rule or other decoration.
- **Dog-eared panels** (`ui/Folded.tsx`, `.dog-shadow` and `.dog-clip` in `globals.css`): floating panels (the gesture hint, the search panel, the types dialog) have their bottom-right corner cut off and a small flap drawn where it folded over (`--fold` 1.5rem). The paper is clipped with `clip-path`, so the shadow lives on the outer element (`drop-shadow`) to follow the cut, and fasteners go on the outer element too (so the clipping does not cut them off). Use `Folded` for any new floating panel; do not use it on bars, drawers or tiles.
- **Torn drawer edge** (`.drawer::after`, drawn by `lib/tornEdge.ts`): the edge of a drawer that faces the board looks like torn paper, not serrated. It is a 22px wide, 1000px tall repeating SVG strip with three layers: a soft shadow, a pale fibrous rim where the paper's core shows through (1.6 to about 5px thick, with thin fibres sticking out), and the page edge itself. The edge is built from five layers of smooth noise (lumps about 200, 100, 40, 20 and 10px long, swinging 4.2 down to 0.7px) plus a fuzz of fine jitter, sampled every 2px; the noise wraps round so the strip tiles with no seam, and a seed makes it repeatable (the two drawers differ). The straight edge of the drawer is at x = 1, so the tear only ever sticks out past it. One image per theme (`--edge-light`, `--edge-dark`, set in `Drawer.tsx`: paper, rim and shadow colours) because an image cannot read the theme colours; if the paper tokens change, change those colours there. The strip runs the full height of the screen, and the drawers have no rounded corners or border on that edge.
- **Marker underline** (`MarkerUnderline` in `Breadcrumb.tsx`): the current breadcrumb step is marked with a wobbly two-stroke red marker line drawn under its text, not a border.
- Motion: calm everywhere except panels **opening**, which are deliberately playful. A drawer swings in like a sheet of paper hung from a pin: it leans back 4deg (pivoting on its bottom outer corner) and slides in with a springy overshoot. **Everything in a drawer ends at the same instant**: the slide and the swing share one duration and curve (`--drawer-time` 600ms, `--drawer-ease` `cubic-bezier(0.34, 1.4, 0.64, 1)` in `globals.css`), the close button spins in, and the rows glide in from the edge starting 30ms apart but each shortened by its delay, so the last row lands exactly when the panel does (never give a part of a panel its own, longer timing: the tilt makes a late bottom edge look wrong). **Closing** is quick and plain (260ms ease-in, no bounce). The scrim fades 340ms in, 260ms out. Because of the overshoot the drawer is drawn 1.5rem wider on its outer edge (off-screen). The **search panel** slides down out from underneath the top bar (420ms, a 5px settle, clipped at the bar's bottom edge, so the bar is above it in z-order) and slides back under it in 240ms, echoing how the edit card slides out from under an item. Tailwind v4 moves things with the `translate` property, so transition `translate` and `rotate`, not `transform`. Reduced-motion users get no swing, stagger or slide. Other controls only give 1px press feedback (`active:translate-y-px`) and `transition` colour changes. Keep playful motion to panels opening; do not make buttons or text bounce. The board's camera animation (400ms) is separate.

### Layout

- **Top bar** (`TopBar.tsx`): the only permanent chrome. One floating paper bar, 56px high, inset 8px from the edges (max width `max-w-4xl`, centred): menu button, pin-head dot and board name (also opens the menu), search, and the red Add button (icon only below `sm`).
- **Left drawer, "Tether"** (`MenuDrawer.tsx`, grouped): Your boards (+ New board) · This board (Rename, Save a backup file, Open a board file) · Look (Theme and Board surface segmented controls) · Customise (Item types and packs) · Help (gesture tips) · Delete this board (last, in thread red).
- **Right drawer, "Add"** (`AddDrawer.tsx`): says where new items will land, then Basics as a 2-column grid of tiles (Section, Note, Photo, Pin), then From your types as rows, then Edit types and packs.
- **Under the bar**: breadcrumb chips (`Breadcrumb.tsx`), and the search panel and string-mode banner use the same top offset (`calc(env(safe-area-inset-top) + 4.25rem)`).
- **Bottom right** (`ZoomControls.tsx`): a zoom and level badge, then one vertical pill: Up, zoom in, zoom out, fit all. **Bottom left**: the hint card until dismissed.
- Put a new global action in the drawer whose purpose fits (Add things = right, everything about boards, files, looks and settings = left). Do not add new permanent buttons to the bar; it stays at four controls.
- **Safe areas**: `viewportFit: "cover"` is set, so every fixed or absolute chrome element offsets itself with `env(safe-area-inset-*)` in its `style`. Views framed by the camera leave `CHROME_TOP` (112px) clear at the top (`Board.tsx`, `fitView`'s `top` argument).
- **Layers** (z-index): board 0 · chrome 20 · search panel 25 · top bar 30 · drawer scrim 40 · drawers, dialogs and the photo viewer 50.
- Chrome sits inside the board's pointer area, so each chrome wrapper has `data-chrome` and stops `pointerdown`; the board ignores wheel and context-menu events from `[data-chrome]` and `[data-modal]`.

### Components (all in `src/components/ui/` unless noted)

| Piece | Use it for |
|---|---|
| `iconBtn` | Round 44px icon-only button (menu, search, close, zoom) |
| `primaryBtn` | The single main action in a view. At most one per screen. Thread red fill |
| `secondaryBtn` | Ordinary actions: paper pill, hairline border |
| `dangerBtn` | Destructive actions: like secondary, thread-red text. Always last in its group |
| `rowBtn` | A full-width row in a drawer or list: icon, label, optional detail |
| `chip` | Breadcrumb steps and similar small labels |
| `panel` | A floating paper card (search, hint) |
| `inputField` | Text inputs in the chrome |
| `groupLabel` | The small uppercase heading above a group |
| `Segmented` | Choose one of two to four options (theme, surface); `rounded-ui` track with `rounded-ui-sm` options |
| `Drawer` | Any slide-out panel (title, optional subtitle, scrolls, closes on Esc or tap outside) |
| `Icon` (`icons.tsx`) | Every chrome icon. Add new ones to its `PATHS` map |
| `useEscape` | Esc closes a drawer or dialog and is swallowed, so the board does not also zoom out |

These class strings live in `ui/styles.ts`; change a look there once and it changes everywhere.

### Iconography

Line icons on a 24px grid, 1.8px stroke, round caps and joins, `currentColor`, drawn inline in `icons.tsx` (inspired by the Lucide set, ISC licence). No emoji in the chrome and no icon font or library. Default size `h-5 w-5`; `h-6 w-6` for the menu button; `h-4 w-4` inside text rows and segmented controls. Map pins on the board (not chrome) may still use emoji.

### Accessibility and touch

- Every tap target is at least 40px (buttons are 44px). Icon-only buttons have an `aria-label`.
- One focus ring everywhere: add `chrome-focus` (2px `focus` outline, 2px offset) to any new interactive element.
- Drawers are `role="dialog"`, labelled by title, and `inert` plus hidden while closed. Segmented controls are `radiogroup`s.
- Text on `paper` is `ink` or `ink-soft`; never put `ink-faint` on anything that must be read, only on labels and placeholders.

### Recipes

- **New drawer row**: a `rowBtn` with an `Icon` (`h-5 w-5 text-ink-soft`) and a label; if it opens a dialog, close the drawer first.
- **New choice setting**: a `Segmented` inside the Look group (or a new `groupLabel` group), with an `Icon` per option where one exists.
- **New dialog**: copy `TypesEditor.tsx`: a bottom sheet on phones (`items-end`, `rounded-t-ui`), centred card from `sm` (`rounded-ui`), `bg-ink/45` scrim, `text-xl font-bold` title, `useEscape`, `data-modal`.
- **New floating control over the board**: wrap it in `data-chrome` with `onPointerDown` stopped, offset it with `env(safe-area-inset-*)`, and use a `panel` or the pill pattern (`rounded-full border border-line bg-paper/95 shadow-paper`).

### Don't

- Add a second accent colour, gradients, glass blur or neon. The palette is cream, brown ink and one red.
- Put dark grey pills over the board (the old look) or bring back a full-width header.
- Use `dark:` variants, raw hex or arbitrary values in chrome.
- Use handwriting in the chrome at all, or more than one UI font.
- Mix corner radii: pick `rounded-ui`, or `rounded-ui-sm` only when nested.
- Stack more than one primary button in a view.

---

## Board-level UI (items, edit card, whiteboard)

The rules below cover what lives on the board. For the app chrome around it (bars, drawers, dialogs) see the design system above.

- Theme: light and dark, dark by default, chosen in the menu drawer (Look). The chrome swaps to its dark tokens; the cork and paper colours are identical in both themes
- **Whiteboard view is switched off** (`WHITEBOARD_ENABLED = false` in `lib/boardStyle.ts`: the menu hides the choice and every device shows cork); the notes below describe the dormant code. Whiteboard view (menu drawer, Look, `lib/boardStyle.ts`, device preference): glossy white surface; notes and sections are a wobbly hand-drawn marker outline (SVG path from `scribblePath`, seeded by item id) on near-white fill, on a surface with generated smears and ghost lines, paper colour mapped to marker colour by `markerColor` in `lib/board.ts`; photos keep a white print and are held by a clear dome magnet; strings are blue marker lines with end dots; the edit card is white with a marker outline
- Map pins: a coloured teardrop with an emoji in its head and a white label chip underneath; pins sit on a map section and are not resizable. Connectors default to red string (blue marker line on the whiteboard) and can be a line, dashed line or arrow in any of six colours with a label drawn with a white outline so it reads over a map
- Map sections: the picture fills the section inside its border and the title sits on a white 85% chip so it stays readable
- Item types: a typed note shows up to three of its filled-in fields as small lines under the title; any item with a link shows a 🔗 in its top corner
- Edit card (width): normally one 288px column. If its content would need a scrollbar in the space it has, it goes two columns wide (600px, `POPOVER_WIDE`; blocks stay whole, the header spans both, and every block / field is its own direct child of the columns container so the two columns come out even: keep it that way, e.g. `ItemFields` returns separate blocks, not one wrapper) instead, and drops back to one column when it fits again. On screens narrower than about 700px it stays one column and scrolls (`ItemPopover.tsx` measures, `Board.tsx` places).
- Edit card: a square-cornered paper card (same flat tinted-paper finish as sections, plain system sans-serif for readability, dashed-underline fields) in the edited item's own colour, dark ink in both themes. Opening (about 0.8s): pulled out from under the item small and diagonal, grows and lifts, then set down beside it. Closing (about 0.5s): lift, shrink, slide back under, then unmount. "Under" is real layering: Board draws a non-interactive copy of the item (and its contents) above the card. Sits right of the item, else left, else inside when the item fills the view; hidden while the camera animates. Items that look small on screen (on-screen area under about 1.3x the card, or under 120x75; world size times current zoom, judged once when the card opens; `isSmallOnScreen` in ItemPopover) can't hide the card, so it glides in instead: one slow arcing fall (about 1s) at a parabolic speed: fastest at the start, slowing toward the landing. It starts large with a big soft shadow, sweeps down and in from further out on the side it will sit on (from the right if the card sits right of the item, from the left if left), and shrinks to normal size as its shadow shrinks and tightens; closing drifts it back out the same way and fades it (about 0.45s). (A crumpled-paper-ball entrance was tried and removed 2026-11-16.)
- Minimum tap target about 40px. Text at least `text-sm` (`text-xs` only for small captions)

## Reading the board when zoomed out

The board must stay readable when everything is in view (about 15 to 30% zoom). Nothing on the board is allowed to shrink below a readable size on screen; instead it is drawn bigger in the world as you zoom out. The camera zoom is the CSS variable `--s` on the world layer (`lodVars` in `Board.tsx`; also set on the edit card's cover layer), and things use it directly in CSS, for example `min(max(30px, calc(12px / var(--s, 1))), 54px)`: never smaller than the normal size, about 12px tall on screen when zoomed out, and capped so it still fits its header.

| Thing | Normal size | Readable minimum on screen | Cap (world px) |
|---|---|---|---|
| Note title | 24px | 11.5px | 60 |
| Note field lines / note text | 16 / 18px | 8.5px | 21 |
| Open section title, top level / nested | 48 / 30px | 15 / 12px | 80 / 54 |
| Closed section title, top level / nested | 72 / 40px | 18 / 13px | 110 / 70 |
| Closed section sub-line | 30 / 20px | 11 / 10px | 50 / 40 |
| Photo caption | 20px | 10px | 40 |
| Map pin (grows about its tip, label too) | 40px head | about 30px head, label about 10.5px | none |
| Strings: line, end dots, labels | 4px, 6px, 18px | 1.8px, 3.5px, 11px | none |

**Overview mode** (`OVERVIEW_SCALE`, below 38% zoom: from 38% up notes show their field lines and text too, enlarged to at least about 8.5px on screen and at most 21px, so the text is readable by 40%): notes show just their title (up to three lines, then cut) and leave out the field lines, the note text and the link and photo icons, so the title can be big. Notes only measure their text to grow (`fitNote`) at 50% and above (`FIT_SCALE`), so a note is never made taller just because its title was enlarged for reading. New text on the board must follow this: size it with `--s` or leave it out of overview, and never let it get smaller than about 10px on screen.

## Zoom feedback

**Cards never tilt** (`STRAIGHT_SCALE` is 0): a tilted card is resampled by the browser and its text, the note title at the top above all, goes soft.

## Camera moves

Every camera move (double-click zoom, +/-, Up, Fit all, search, breadcrumb) is a frame-by-frame glide with a strong **ease in-out** (quartic: it leaves slowly, speeds up in the middle and lands slowly): the zoom is eased in log space while the point at the middle of the screen slides across, over 650ms plus 260ms per doubling of zoom (at most 1.25s). A touch, drag or scroll takes over at once. **Performance rule:** the camera is moved straight on the page every frame (`applyCamera`, `moveCamera` in `Board.tsx`: the world layer's transform, `will-change` while moving, the cork grain) and React's copy (`view`) is updated at most every 120ms, or at once when the zoom crosses a level (which items show, overview mode; `lodKey`), and when a gesture ends. Never set the camera with `setView` directly, and read the live camera from `camRef` (not `view`) inside event handlers. **A double-click zooms in by at most 50 percentage points** (`MAX_ZOOM_STEP`: 25% can reach 75%, 45% can reach 95%, 100% can reach 150%, never 45% to 170%); double-click again to go further. Zooming out, search results and Zoom to in the settings card are not limited.

Show current zoom and level in the small badge above the zoom controls at bottom right. Hidden levels fade (250ms); camera moves are the eased glides described above and never run during a gesture.
