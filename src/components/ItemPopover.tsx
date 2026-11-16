import { useState } from "react";
import { PAPER_COLORS } from "@/lib/board";
import type { Item, ItemKind, Link } from "@/lib/types";

export const POPOVER_WIDTH = 288;

export interface PopoverPlacement {
  left: number;
  top: number;
  /** Which side of the item it sits on. */
  side: "left" | "right" | "inside";
  /** The item's size on screen (world size times zoom), used to decide whether it is too small to hide the card. */
  anchor: { w: number; h: number };
}

/**
 * The slide-out only works when the item is big enough to hide the card, so an item that looks small next to
 * the card on screen gets a floating-down entrance instead.
 */
const CARD_AREA_ESTIMATE = POPOVER_WIDTH * 240;
export function isSmallOnScreen(anchor: { w: number; h: number }): boolean {
  return anchor.w * anchor.h < CARD_AREA_ESTIMATE * 1.3 || anchor.w < 120 || anchor.h < 75;
}

interface Props {
  item: Item;
  placement: PopoverPlacement;
  maxHeight: number;
  /** True while it slides back under the item after you click away. */
  leaving: boolean;
  links: Link[];
  itemsById: Map<string, Item>;
  linking: boolean;
  onPatch: (patch: Partial<Item>) => void;
  onDelete: () => void;
  onZoomTo: () => void;
  onToggleLink: () => void;
  onRemoveLink: (id: string) => void;
  onAddInside: (kind: ItemKind) => void;
  onClose: () => void;
  /** Called when the slide-back animation has finished. */
  onLeft: () => void;
}

// The card takes the item's paper colour, so text is always dark ink in both themes.
const btn =
  "rounded-sm border border-black/35 bg-white/35 px-2.5 py-1 text-sm font-medium text-stone-800 active:bg-white/70";
const field =
  "w-full border-0 border-b-2 border-dashed border-black/35 bg-transparent px-1 py-1 text-stone-900 placeholder:text-stone-500 focus:border-black/70 focus:outline-none";

const ENTER = { right: "slide-from-left", left: "slide-from-right", inside: "slide-from-top" } as const;
const EXIT = { right: "slide-back-left", left: "slide-back-right", inside: "slide-back-top" } as const;

/**
 * Edit card in the item's own colour, finished like a section. It is pulled out from underneath the item
 * (Board draws a copy of the item above this card, so it genuinely passes under it) and set down beside it.
 * For an item too small on screen to hide the card, it instead floats down from above and settles.
 */
export default function ItemPopover(p: Props) {
  const { item, placement } = p;
  const mine = p.links.filter((l) => l.from === item.id || l.to === item.id);
  const side = placement.side;
  // Decided once when the card opens (it remounts per item), so zooming while it is open never swaps animations.
  const [floats] = useState(() => isSmallOnScreen(placement.anchor));
  // The floating card comes from, and leaves toward, the side it sits on (further out than where it lands).
  const floatSide = side === "left" ? "left" : "right";
  const enter = floats ? `float-in-${floatSide}` : ENTER[side];
  const exit = floats ? `float-out-${floatSide}` : EXIT[side];

  return (
    <div className="pointer-events-none absolute z-30" style={{ left: placement.left, top: placement.top, width: POPOVER_WIDTH }}>
      <div
        className={`${p.leaving ? exit : enter} ${p.leaving ? "pointer-events-none" : "pointer-events-auto"} overflow-auto rounded-sm p-3 text-stone-800`}
        onAnimationEnd={(e) => {
          if (p.leaving && e.target === e.currentTarget) p.onLeft();
        }}
        style={{
          maxHeight: p.maxHeight,
          backgroundColor: item.color,
          // Same finish as a section: the paper colour under a pale wash.
          backgroundImage: "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6))",
          boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">{item.kind}</span>
          <button className={btn} onClick={p.onClose} aria-label="Close">
            Done
          </button>
        </div>

        <input
          value={item.title}
          onChange={(e) => p.onPatch({ title: e.target.value })}
          placeholder="Title"
          className={`${field} mb-2 text-lg font-bold`}
        />
        {item.kind !== "section" && (
          <textarea
            value={item.text}
            onChange={(e) => p.onPatch({ text: e.target.value })}
            placeholder="Notes"
            rows={3}
            className={`${field} mb-2 resize-none text-base`}
          />
        )}

        <div className="mb-3 flex gap-2">
          {PAPER_COLORS.map((c) => (
            <button
              key={c}
              aria-label={`Colour ${c}`}
              onClick={() => p.onPatch({ color: c })}
              className={`h-6 w-6 rounded-sm border-2 ${item.color === c ? "border-stone-800" : "border-black/25"}`}
              style={{ background: c }}
            />
          ))}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <button className={btn} onClick={p.onZoomTo}>
            Zoom to
          </button>
          <button className={`${btn} ${p.linking ? "border-red-600 bg-red-200" : ""}`} onClick={p.onToggleLink}>
            {p.linking ? "Tap another item…" : "Tie string"}
          </button>
          <button className={`${btn} text-red-700`} onClick={p.onDelete}>
            Delete
          </button>
        </div>

        {item.kind === "section" && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-stone-600">Add inside:</span>
            <button className={btn} onClick={() => p.onAddInside("section")}>
              + Section
            </button>
            <button className={btn} onClick={() => p.onAddInside("note")}>
              + Note
            </button>
          </div>
        )}

        {mine.length > 0 && (
          <div className="text-sm">
            <div className="mb-1 text-stone-600">Strings</div>
            {mine.map((l) => {
              const otherId = l.from === item.id ? l.to : l.from;
              return (
                <div key={l.id} className="flex items-center justify-between py-0.5">
                  <span className="truncate">↔ {p.itemsById.get(otherId)?.title || "(untitled)"}</span>
                  <button className="px-2 text-red-700" onClick={() => p.onRemoveLink(l.id)} aria-label="Cut string">
                    ✂
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
