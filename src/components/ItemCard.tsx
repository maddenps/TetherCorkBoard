import { useLayoutEffect, useMemo, useRef, type CSSProperties } from "react";
import { scribblePath } from "@/lib/marker";
import { markerColor } from "@/lib/board";
import type { BoardStyle } from "@/lib/boardStyle";
import { fieldSummary, safeUrl } from "@/lib/model";
import type { Item, ItemType } from "@/lib/types";
import PinMarker from "./PinMarker";

interface Props {
  item: Item;
  /** Is this item shown at the current zoom level? */
  visible: boolean;
  /** For sections: are its children shown at the current zoom level? */
  childrenVisible: boolean;
  childCount: number;
  depth: number;
  selected: boolean;
  linkTarget: boolean;
  boardStyle?: BoardStyle;
  /** The item's type, if it has one, so its field values can be shown on the card. */
  type?: ItemType;
  /**
   * Whiteboard items are see-through. The copy drawn above the edit card (see Board) needs a fill to hide the card
   * while it slides out or back: "enter" fills at first and then fades away, "solid" stays filled.
   */
  cover?: "enter" | "solid";
  /** Notes call this when their content needs more height than they have, so nothing is ever cut off. */
  onFit?: (id: string, h: number, exact?: boolean) => void;
  /** Zoomed in far enough to read the text: draw the card square so its text is rendered sharp, not resampled at a tilt. */
  straight?: boolean;
  /** Opens the photo stack for an item (the picture-frame icon). */
  onOpenPhotos?: (id: string) => void;
}

// Handwriting-style system fonts, so nothing has to be downloaded.
export const HAND = '"Segoe Print", "Bradley Hand", "Chalkboard SE", "Comic Sans MS", cursive';

/** Stable small tilt per item so notes look hand-stuck rather than gridded. */
function tilt(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 1000) / 1000 - 0.5) * 2.6;
}

const STICKY_SHADING =
  "linear-gradient(180deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0) 26px), linear-gradient(160deg, rgba(255,255,255,0.5), rgba(255,255,255,0) 55%)";

// Whiteboard view: the fill used by the cover copy under the hand-drawn marker outline (see lib/marker.ts).
const BOARD_FILL = "#fbfcfc";

const SECTION_PAPER = [
  "linear-gradient(to right, transparent 55px, rgba(220,70,70,0.4) 55px, rgba(220,70,70,0.4) 57px, transparent 57px)",
  "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6))",
].join(", ");

export default function ItemCard({ item, visible, childrenVisible, childCount, depth, selected, linkTarget, boardStyle = "cork", cover, type, onFit, straight, onOpenPhotos }: Props) {
  const wb = boardStyle === "whiteboard";
  const marker = markerColor(item.color);
  // Marker ink on the whiteboard; left undefined on cork so the text classes below apply.
  const ink = wb ? marker : undefined;
  // Hand-drawn outline in item units.
  const outline = useMemo(
    () => (wb && item.kind !== "image" && item.kind !== "pin" ? scribblePath(item.w, item.h, item.id, 0, 0.9) : ""),
    [wb, item.kind, item.w, item.h, item.id],
  );
  const summary = fieldSummary(type, item);
  const noteRef = useRef<HTMLDivElement>(null);
  const summaryKey = summary.join("|");
  // Grow a note until all of its text fits (never shrinks, so a note you made bigger stays bigger).
  useLayoutEffect(() => {
    const el = noteRef.current;
    if (!onFit || item.kind !== "note" || !el) return;
    const need = Math.ceil(el.offsetHeight) + (wb ? 8 : 20); // room for the snipped corner
    if (item.autoFit) {
      // Auto-fit follows the content both ways, and leaves some spare room: a little too big beats a little too small.
      const target = need + 14;
      if (Math.abs(target - item.h) > 0.5) onFit(item.id, target, true);
    } else if (need > item.h + 0.5) onFit(item.id, need);
  }, [onFit, item.id, item.kind, item.w, item.h, item.autoFit, item.title, item.text, summaryKey, wb]);
  if (item.kind === "pin") {
    return <PinMarker item={item} visible={visible} depth={depth} selected={selected} linkTarget={linkTarget} />;
  }
  const isSection = item.kind === "section";
  const isImage = item.kind === "image";
  const hasMap = isSection && !!item.mapData;
  const linkUrl = safeUrl(item.url);
  const photoCount = item.photos?.length ?? 0;
  // Open sections let you pan through their body; only the header grabs.
  const bodyPassesThrough = isSection && childrenVisible;

  const paper: CSSProperties = wb
    ? isImage
      ? { backgroundColor: "#fdfdfb", border: "1px solid rgba(0,0,0,0.18)", borderRadius: 2 }
      : {} // the outline and its opaque fill are drawn by the SVG below
    : isSection
    ? { backgroundColor: item.color, backgroundImage: SECTION_PAPER, borderRadius: 4 }
    : isImage
      ? { backgroundColor: "#fdfcf6", borderRadius: 2 }
      : {
          backgroundColor: item.color,
          backgroundImage: STICKY_SHADING,
          // Snipped bottom-right corner; the flap is drawn separately below.
          clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%)",
        };

  return (
    <div
      data-item-id={visible ? item.id : undefined}
      className="absolute"
      style={{
        left: item.x,
        top: item.y,
        width: item.w,
        height: item.h,
        zIndex: depth * 2 + (isSection ? 0 : 1),
        opacity: visible ? 1 : 0,
        pointerEvents: !visible || bodyPassesThrough ? "none" : "auto",
        transition: "opacity 250ms",
      }}
    >
      <div
        className="relative h-full w-full"
        style={{
          // A tilted card is resampled by the compositor and its text goes soft, so it only tilts while zoomed out.
          transform: isSection || (wb && !isImage) ? undefined : `rotate(${straight ? 0 : tilt(item.id)}deg)`,
          transition: "transform 200ms",
          filter: wb ? (isImage ? "drop-shadow(1px 2px 2px rgba(0,0,0,0.25))" : undefined) : "drop-shadow(3px 5px 4px rgba(0,0,0,0.38))",
        }}
      >
        {outline && (
          <svg width={item.w} height={item.h} className="pointer-events-none absolute left-0 top-0 overflow-visible">
            {/* A faint lighter wash so items lift off the board a little while the marks still show through. */}
            <path d={outline} fill="#ffffff" fillOpacity={0.2} stroke="none" />
            {cover && <path d={outline} fill={BOARD_FILL} stroke="none" className={cover === "enter" ? "cover-fill-enter" : undefined} />}
            <path d={outline} fill="none" stroke={marker} strokeWidth={isSection ? 4.5 : 3.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />
          </svg>
        )}
        <div className="relative h-full w-full overflow-hidden" style={paper}>
          {isImage && item.imageData && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageData}
              alt={item.title}
              draggable={false}
              className="pointer-events-none absolute left-2.5 top-2.5 object-cover"
              style={{ width: "calc(100% - 20px)", height: "calc(100% - 52px)" }}
            />
          )}

          {hasMap && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.mapData} alt="" draggable={false} className="pointer-events-none absolute inset-1.5 object-cover" style={{ width: "calc(100% - 12px)", height: "calc(100% - 12px)" }} />
          )}

          {isSection ? (
            childrenVisible ? (
              <div
                data-item-id={visible ? item.id : undefined}
                className={`pointer-events-auto absolute truncate font-bold text-stone-800 ${hasMap ? "rounded px-3 py-1" : `left-0 top-0 w-full pr-24 pt-3 ${wb ? "pl-5" : "pl-16"}`}`}
                style={{ fontFamily: HAND, fontSize: depth === 0 ? 48 : 30, color: ink, ...(hasMap ? { left: 12, top: 12, maxWidth: "calc(100% - 24px)", background: "rgba(255,255,255,0.85)" } : {}) }}
              >
                {item.title}
              </div>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-stone-800" style={{ color: ink }}>
                <div className={hasMap ? "rounded px-4 py-2" : undefined} style={hasMap ? { background: "rgba(255,255,255,0.85)" } : undefined}>
                <div className="font-bold leading-tight" style={{ fontFamily: HAND, fontSize: depth === 0 ? 72 : 40 }}>
                  {item.title}
                </div>
                <div className="mt-2 text-stone-600" style={{ fontSize: depth === 0 ? 30 : 20, color: ink, opacity: wb ? 0.75 : undefined }}>
                  {childCount > 0 ? `${childCount} inside — zoom in` : "empty — zoom in and add things"}
                </div>
                </div>
              </div>
            )
          ) : isImage ? (
            <div
              className="absolute bottom-0 w-full truncate px-2 pb-1.5 text-center font-semibold text-stone-800"
              style={{ fontFamily: HAND, fontSize: 20 }}
            >
              {item.title}
            </div>
          ) : (
            <div ref={noteRef} className={`px-3 pb-2 text-stone-800 ${wb ? "pt-7" : "pt-6"}`} style={{ color: ink }}>
              <div className="font-bold leading-tight" style={{ fontFamily: HAND, fontSize: 24 }}>
                {item.title}
              </div>
              {summary.length > 0 && (
                <div className="mt-1 text-base font-semibold leading-snug opacity-80">
                  {summary.map((line) => (
                    <div key={line} className="break-words">{line}</div>
                  ))}
                </div>
              )}
              {item.text && <div className="mt-1 whitespace-pre-line break-words text-lg leading-snug">{item.text}</div>}
            </div>
          )}
        </div>

        {item.kind === "note" && !wb && (
          <div
            className="pointer-events-none absolute bottom-0 right-0"
            style={{ width: 18, height: 18, background: "linear-gradient(to bottom right, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 50%)" }}
          />
        )}

        {(linkUrl || photoCount > 0) && (
          // Real controls: they take the click themselves so the board never sees it as a click on the item.
          <div
            className="absolute right-1 top-0 flex items-center gap-1"
            style={{ pointerEvents: visible && !cover ? "auto" : "none" }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {photoCount > 0 && (
              <button
                type="button"
                title={`${photoCount} photo${photoCount === 1 ? "" : "s"}`}
                aria-label={`Look through ${photoCount} photos`}
                className="relative cursor-pointer rounded px-1 text-2xl leading-none hover:bg-black/10"
                onClick={() => onOpenPhotos?.(item.id)}
              >
                🖼️
                {photoCount > 1 && (
                  <span className="absolute -bottom-1 -right-1 rounded-full bg-stone-800 px-1 text-xs font-bold leading-4 text-white">{photoCount}</span>
                )}
              </button>
            )}
            {linkUrl && (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={linkUrl}
                aria-label="Open link in a new tab"
                className="cursor-pointer rounded px-1 text-2xl leading-none hover:bg-black/10"
              >
                🔗
              </a>
            )}
          </div>
        )}

        {linkTarget && (
          <div
            className={`pointer-events-none absolute -inset-1.5 rounded-md border-4 border-red-500`}
          />
        )}

        {!wb && (
          // The thumbtack: drag it anywhere on the item and strings tied to the item follow it.
          <div
            data-tack={visible ? item.id : undefined}
            title="Drag to move the pin"
            className="absolute h-4 w-4 cursor-move rounded-full bg-red-600 ring-2 ring-red-300"
            style={{
              ...(item.pin ? { left: `${item.pin.x * 100}%`, top: `${item.pin.y * 100}%`, transform: "translate(-50%, -50%)" } : { left: "50%", top: 4, transform: "translateX(-50%)" }),
              boxShadow: "1px 2px 3px rgba(0,0,0,0.5)",
              pointerEvents: visible && !cover ? "auto" : "none",
            }}
          />
        )}
        {wb && isImage && <Magnet at={item.pin} id={visible && !cover ? item.id : undefined} />}
      </div>
    </div>
  );
}

/** A clear plastic dome magnet: you can see the little metal disc through it. */
function Magnet({ at, id }: { at?: { x: number; y: number }; id?: string }) {
  return (
    <div
      data-tack={id}
      className="absolute flex h-8 w-8 cursor-move items-center justify-center rounded-full"
      style={{
        pointerEvents: id ? "auto" : "none",
        ...(at
          ? { left: `${at.x * 100}%`, top: `${at.y * 100}%`, transform: "translate(-50%, -50%)" }
          : { left: "50%", top: 0, transform: "translate(-50%, -33%)" }),
        background:
          "radial-gradient(circle at 34% 28%, rgba(255,255,255,0.95), rgba(200,225,248,0.45) 38%, rgba(110,160,215,0.5) 100%)",
        border: "1.5px solid rgba(255,255,255,0.75)",
        boxShadow: "0 3px 5px rgba(0,0,0,0.35), inset 0 -3px 4px rgba(50,100,170,0.4)",
      }}
    >
      <div
        className="h-3.5 w-3.5 rounded-full"
        style={{ background: "radial-gradient(circle at 35% 30%, #cbd5e1, #64748b)", opacity: 0.8, boxShadow: "0 1px 1px rgba(0,0,0,0.4)" }}
      />
    </div>
  );
}
