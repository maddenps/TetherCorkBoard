import { useMemo, type CSSProperties } from "react";
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

export default function ItemCard({ item, visible, childrenVisible, childCount, depth, selected, linkTarget, boardStyle = "cork", cover, type }: Props) {
  const wb = boardStyle === "whiteboard";
  const marker = markerColor(item.color);
  // Marker ink on the whiteboard; left undefined on cork so the text classes below apply.
  const ink = wb ? marker : undefined;
  // Hand-drawn outline in item units.
  const outline = useMemo(
    () => (wb && item.kind !== "image" && item.kind !== "pin" ? scribblePath(item.w, item.h, item.id, 0, 0.9) : ""),
    [wb, item.kind, item.w, item.h, item.id],
  );
  if (item.kind === "pin") {
    return <PinMarker item={item} visible={visible} depth={depth} selected={selected} linkTarget={linkTarget} />;
  }
  const isSection = item.kind === "section";
  const isImage = item.kind === "image";
  const hasMap = isSection && !!item.mapData;
  const hasLink = !!safeUrl(item.url);
  const summary = fieldSummary(type, item);
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
          transform: isSection || (wb && !isImage) ? undefined : `rotate(${tilt(item.id)}deg)`,
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
                className={`pointer-events-auto absolute cursor-grab truncate font-bold text-stone-800 ${hasMap ? "rounded px-3 py-1" : `left-0 top-0 w-full pr-4 pt-3 ${wb ? "pl-5" : "pl-16"}`}`}
                style={{ fontFamily: HAND, fontSize: depth === 0 ? 38 : 24, color: ink, ...(hasMap ? { left: 12, top: 12, maxWidth: "calc(100% - 24px)", background: "rgba(255,255,255,0.85)" } : {}) }}
              >
                {item.title}
              </div>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-stone-800" style={{ color: ink }}>
                <div className={hasMap ? "rounded px-4 py-2" : undefined} style={hasMap ? { background: "rgba(255,255,255,0.85)" } : undefined}>
                <div className="font-bold leading-tight" style={{ fontFamily: HAND, fontSize: depth === 0 ? 64 : 32 }}>
                  {item.title}
                </div>
                <div className="mt-2 text-stone-600" style={{ fontSize: depth === 0 ? 26 : 15, color: ink, opacity: wb ? 0.75 : undefined }}>
                  {childCount > 0 ? `${childCount} inside — zoom in` : "empty — zoom in and add things"}
                </div>
                </div>
              </div>
            )
          ) : isImage ? (
            <div
              className="absolute bottom-0 w-full truncate px-2 pb-1.5 text-center font-semibold text-stone-800"
              style={{ fontFamily: HAND, fontSize: 16 }}
            >
              {item.title}
            </div>
          ) : (
            <div className={`px-3 pb-2 text-stone-800 ${wb ? "pt-3" : "pt-6"}`} style={{ color: ink }}>
              <div className="font-bold leading-tight" style={{ fontFamily: HAND, fontSize: 18 }}>
                {item.title}
              </div>
              {summary.length > 0 && (
                <div className="mt-1 text-xs font-semibold leading-snug opacity-80">
                  {summary.slice(0, 3).map((line) => (
                    <div key={line} className="truncate">{line}</div>
                  ))}
                </div>
              )}
              {item.text && <div className="mt-1 line-clamp-3 text-sm leading-snug">{item.text}</div>}
            </div>
          )}
        </div>

        {item.kind === "note" && !wb && (
          <div
            className="pointer-events-none absolute bottom-0 right-0"
            style={{ width: 18, height: 18, background: "linear-gradient(to bottom right, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 50%)" }}
          />
        )}

        {hasLink && <div className="pointer-events-none absolute right-1 top-0 text-base leading-none" aria-hidden>🔗</div>}

        {(selected || linkTarget) && (
          <div
            className={`pointer-events-none absolute -inset-1.5 rounded-md border-4 ${linkTarget ? "border-red-500" : "border-sky-500"}`}
          />
        )}

        {!wb && (
          <div className="pointer-events-none absolute left-1/2 top-1 h-4 w-4 -translate-x-1/2 rounded-full bg-red-600 ring-2 ring-red-300" style={{ boxShadow: "1px 2px 3px rgba(0,0,0,0.5)" }} />
        )}
        {wb && isImage && <Magnet />}
      </div>
    </div>
  );
}

/** A clear plastic dome magnet: you can see the little metal disc through it. */
function Magnet() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-0 flex h-8 w-8 -translate-x-1/2 -translate-y-1/3 items-center justify-center rounded-full"
      style={{
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
