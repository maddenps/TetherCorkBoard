# Style Guide

Visual rules for new UI. See `BestPractices.md` for code rules.

---

## Stack

- **Tailwind v4**, tokens in `src/app/globals.css` under `@theme`
- No arbitrary Tailwind values (`w-[320px]`, `bg-[#fff]`). Use the scale or define a token
- Runtime-computed values (item position and size, camera transform, per-item colour) go in the `style` prop
- No icon or font libraries yet; system font stack, plain text or emoji/SVG for icons. Everything must be bundled for offline

## The board

- Background: cork texture painted once at startup by `lib/cork.ts` (seamless 768px tile: tan mottling, fine grain, dark and light granules). It pans with the camera and zooms gently. No image download
- Paper colours for notes: yellow, pink, green, blue, lilac, white (`PAPER_COLORS` in `lib/board.ts`)
- Sections: opaque tinted paper with a red margin line (no ruled lines), handwriting-style title that shrinks to a header when zoomed in
- Notes: sticky notes with a snipped, folded corner and a slight random tilt. Photos: white polaroid frame with caption. All have a drop shadow and a red pin at top centre
- Strings: red (`#b91c1c`), 4 world px wide, slight sag, faint offset shadow
- Selection: sky-blue ring. String target: red ring

## UI chrome

- Theme: light and dark, dark by default, toggled in the top bar. Dark uses mid greys (zinc) rather than near-black; the cork and paper colours are identical in both themes
- Whiteboard view (top bar toggle, `lib/boardStyle.ts`, device preference): glossy white surface; notes and sections are a wobbly hand-drawn marker outline (SVG path from `scribblePath`, seeded by item id) on near-white fill, on a surface with generated smears and ghost lines, paper colour mapped to marker colour by `markerColor` in `lib/board.ts`; photos keep a white print and are held by a clear dome magnet; strings are blue marker lines with end dots; the edit card is white with a marker outline
- Map pins: a coloured teardrop with an emoji in its head and a white label chip underneath; pins sit on a map section and are not resizable. Connectors default to red string (blue marker line on the whiteboard) and can be a line, dashed line or arrow in any of six colours with a label drawn with a white outline so it reads over a map
- Map sections: the picture fills the section inside its border and the title sits on a white 85% chip so it stays readable
- Item types: a typed note shows up to three of its filled-in fields as small lines under the title; any item with a link shows a 🔗 in its top corner
- Top bar: stone/zinc with matching buttons
- Floating controls: white pill buttons with shadow over the board, never covering the centre
- Edit card: a square-cornered paper card (same flat tinted-paper finish as sections, plain system sans-serif for readability, dashed-underline fields) in the edited item's own colour, dark ink in both themes. Opening (about 0.8s): pulled out from under the item small and diagonal, grows and lifts, then set down beside it. Closing (about 0.5s): lift, shrink, slide back under, then unmount. "Under" is real layering: Board draws a non-interactive copy of the item (and its contents) above the card. Sits right of the item, else left, else inside when the item fills the view; hidden while the camera animates. Items that look small on screen (on-screen area under about 1.3x the card, or under 120x75; world size times current zoom, judged once when the card opens; `isSmallOnScreen` in ItemPopover) can't hide the card, so it glides in instead: one slow arcing fall (about 1s) at a parabolic speed: fastest at the start, slowing toward the landing. It starts large with a big soft shadow, sweeps down and in from further out on the side it will sit on (from the right if the card sits right of the item, from the left if left), and shrinks to normal size as its shadow shrinks and tightens; closing drifts it back out the same way and fades it (about 0.45s). (A crumpled-paper-ball entrance was tried and removed 2026-11-16.)
- Minimum tap target about 40px. Text at least `text-sm`
- Dark chrome around a warm board is intentional; do not add a light/dark toggle until asked

## Zoom feedback

Show current zoom and level in the small badge at bottom right. Hidden levels fade (250ms), the camera animates (400ms) for programmatic moves, and never animates during a gesture.
