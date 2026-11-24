import { useRef, useState } from "react";
import { PAPER_COLORS, markerColor } from "@/lib/board";
import type { BoardStyle } from "@/lib/boardStyle";
import { PIN_COLORS, PIN_ICONS } from "@/lib/model";
import type { Item, ItemKind, ItemType, Link } from "@/lib/types";
import { btn, field, select } from "./cardStyles";
import ItemFields from "./ItemFields";
import LinkRow from "./LinkRow";

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
  types: ItemType[];
  /** Items a pin can point at (everything except the pin itself). */
  pinTargets: Item[];
  linking: boolean;
  boardStyle: BoardStyle;
  onPatch: (patch: Partial<Item>) => void;
  onDelete: () => void;
  onZoomTo: () => void;
  onToggleLink: () => void;
  onRemoveLink: (id: string) => void;
  onPatchLink: (id: string, patch: Partial<Link>) => void;
  onSetPinTarget: (targetId: string | null) => void;
  onPickMap: (file: File) => void;
  onAddPhotos: (files: File[]) => void;
  onViewPhotos: () => void;
  onAddInside: (kind: ItemKind) => void;
  onClose: () => void;
  /** Called when the slide-back animation has finished. */
  onLeft: () => void;
}

const ENTER = { right: "slide-from-left", left: "slide-from-right", inside: "slide-from-top" } as const;
const EXIT = { right: "slide-back-left", left: "slide-back-right", inside: "slide-back-top" } as const;

/**
 * Edit card in the item's own colour, finished like a section. It is pulled out from underneath the item
 * (Board draws a copy of the item above this card, so it genuinely passes under it) and set down beside it.
 * For an item too small on screen to hide the card, it instead floats down from above and settles.
 */
export default function ItemPopover(p: Props) {
  const { item, placement } = p;
  const wb = p.boardStyle === "whiteboard";
  const isPin = item.kind === "pin";
  const marker = markerColor(item.color);
  const mapRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const photos = item.photos ?? [];
  const mine = p.links.filter((l) => l.from === item.id || l.to === item.id);
  const pinTarget = isPin ? p.links.find((l) => l.from === item.id)?.to ?? "" : "";
  const side = placement.side;
  // Decided once when the card opens (it remounts per item), so zooming while it is open never swaps animations.
  const [floats] = useState(() => isSmallOnScreen(placement.anchor));
  // The floating card comes from, and leaves toward, the side it sits on (further out than where it lands).
  const floatSide = side === "left" ? "left" : "right";
  const enter = floats ? `float-in-${floatSide}` : ENTER[side];
  const exit = floats ? `float-out-${floatSide}` : EXIT[side];
  const swatches = isPin ? PIN_COLORS : PAPER_COLORS;
  const cardColor = isPin ? "#fbfaf4" : item.color;

  return (
    <div className="pointer-events-none absolute z-30" style={{ left: placement.left, top: placement.top, width: POPOVER_WIDTH }}>
      <div
        className={`${p.leaving ? exit : enter} ${p.leaving ? "pointer-events-none" : "pointer-events-auto"} overflow-auto rounded-sm p-3 text-stone-800`}
        onAnimationEnd={(e) => {
          if (p.leaving && e.target === e.currentTarget) p.onLeft();
        }}
        style={{
          maxHeight: p.maxHeight,
          // Same finish as a section: the paper colour under a pale wash (whiteboard: white with a marker outline).
          backgroundColor: wb ? "#fbfcfc" : cardColor,
          backgroundImage: wb ? undefined : "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6))",
          border: wb ? `3px solid ${isPin ? item.color : marker}` : undefined,
          borderRadius: wb ? "14px 9px 16px 10px / 10px 16px 9px 14px" : undefined,
          boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">{item.kind}</span>
          <button className={btn} onClick={p.onClose} aria-label="Close settings">
            Done
          </button>
        </div>

        <input
          value={item.title}
          onChange={(e) => p.onPatch({ title: e.target.value })}
          placeholder={isPin ? "Label" : "Title"}
          className={`${field} mb-2 text-lg font-bold`}
        />
        {item.kind !== "section" && !isPin && (
          <textarea
            value={item.text}
            onChange={(e) => p.onPatch({ text: e.target.value })}
            placeholder="Notes"
            rows={3}
            className={`${field} mb-2 resize-none text-base`}
          />
        )}

        <div className="mb-3 flex flex-wrap gap-2">
          {swatches.map((c) => (
            <button
              key={c}
              aria-label={`Colour ${c}`}
              onClick={() => p.onPatch({ color: c })}
              className={`h-6 w-6 rounded-sm border-2 ${item.color === c ? "border-stone-800" : "border-black/25"} ${isPin ? "rounded-full" : ""}`}
              style={{ background: wb && !isPin ? markerColor(c) : c }}
            />
          ))}
        </div>

        {isPin && (
          <div className="mb-3 space-y-2 text-sm">
            <div className="flex flex-wrap gap-1.5">
              {PIN_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => p.onPatch({ icon })}
                  className={`flex h-8 w-8 items-center justify-center rounded-sm border-2 text-lg ${(item.icon || "📍") === icon ? "border-stone-800 bg-white/70" : "border-black/20 bg-white/30"}`}
                  aria-label={`Icon ${icon}`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2">
              <span className="text-stone-600">Points to</span>
              <select value={pinTarget} onChange={(e) => p.onSetPinTarget(e.target.value || null)} className={`${select} min-w-0 flex-1`}>
                <option value="">(nothing)</option>
                {p.pinTargets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title || "(untitled)"}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <ItemFields item={item} types={p.types} onPatch={p.onPatch} />

        {(item.kind === "note" || item.kind === "section") && (
          <label className="mb-3 flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!item.autoFit}
              onChange={(e) => p.onPatch({ autoFit: e.target.checked ? true : undefined })}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>
              Auto-fit size to its content
              <span className="block text-xs text-stone-600">
                {item.kind === "note" ? "Height follows the text" : "Grows and shrinks around what is inside"}, with a little spare room.
                Resizing by hand turns this off.
              </span>
            </span>
          </label>
        )}

        {(item.kind === "note" || item.kind === "section") && (
          <div className="mb-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-stone-600">Photos</span>
              <button className={btn} onClick={() => photoRef.current?.click()}>
                Add photos…
              </button>
              {photos.length > 0 && (
                <button className={btn} onClick={p.onViewPhotos}>
                  View ({photos.length})
                </button>
              )}
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = [...(e.target.files ?? [])];
                  e.target.value = "";
                  if (files.length) p.onAddPhotos(files);
                }}
              />
            </div>
            {photos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {photos.map((src, n) => (
                  <div key={n} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" draggable={false} className="h-14 w-14 rounded-sm object-cover" />
                    <button
                      aria-label="Remove photo"
                      className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-red-600 text-xs font-bold leading-5 text-white"
                      onClick={() => p.onPatch({ photos: photos.filter((_, j) => j !== n) })}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {item.kind === "section" && (
          <div className="mb-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-stone-600">Map</span>
              <button className={btn} onClick={() => mapRef.current?.click()}>
                {item.mapData ? "Change image…" : "Set map image…"}
              </button>
              {item.mapData && (
                <button className={btn} onClick={() => p.onPatch({ mapData: undefined })}>
                  Remove
                </button>
              )}
              <input
                ref={mapRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) p.onPickMap(file);
                }}
              />
            </div>
          </div>
        )}

        <div className="mb-3 flex flex-wrap gap-2">
          <button className={btn} onClick={p.onZoomTo}>
            Zoom to
          </button>
          <button className={`${btn} ${p.linking ? "border-red-600 bg-red-200" : ""}`} onClick={p.onToggleLink}>
            {p.linking ? "Tap another item…" : "Connect"}
          </button>
          {item.pin && !isPin && (
            <button className={btn} onClick={() => p.onPatch({ pin: undefined })} title="Drag the red pin to move it; this puts it back at the top centre">
              Reset pin
            </button>
          )}
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
            <button className={btn} onClick={() => p.onAddInside("pin")}>
              + Pin
            </button>
          </div>
        )}

        {mine.length > 0 && (
          <div className="text-sm">
            <div className="mb-1 text-stone-600">Connectors</div>
            {mine.map((l) => {
              const otherId = l.from === item.id ? l.to : l.from;
              return (
                <LinkRow
                  key={l.id}
                  link={l}
                  otherTitle={p.itemsById.get(otherId)?.title || "(untitled)"}
                  onPatch={(patch) => p.onPatchLink(l.id, patch)}
                  onRemove={() => p.onRemoveLink(l.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
