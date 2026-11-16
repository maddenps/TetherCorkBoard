import type { CSSProperties } from "react";
import type { Item } from "@/lib/types";

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

const SECTION_PAPER = [
  "linear-gradient(to right, transparent 55px, rgba(220,70,70,0.4) 55px, rgba(220,70,70,0.4) 57px, transparent 57px)",
  "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6))",
].join(", ");

export default function ItemCard({ item, visible, childrenVisible, childCount, depth, selected, linkTarget }: Props) {
  const isSection = item.kind === "section";
  const isImage = item.kind === "image";
  // Open sections let you pan through their body; only the header grabs.
  const bodyPassesThrough = isSection && childrenVisible;

  const paper: CSSProperties = isSection
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
          transform: isSection ? undefined : `rotate(${tilt(item.id)}deg)`,
          filter: "drop-shadow(3px 5px 4px rgba(0,0,0,0.38))",
        }}
      >
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

          {isSection ? (
            childrenVisible ? (
              <div
                data-item-id={visible ? item.id : undefined}
                className="pointer-events-auto absolute left-0 top-0 w-full cursor-grab truncate pl-16 pr-4 pt-3 font-bold text-stone-800"
                style={{ fontFamily: HAND, fontSize: depth === 0 ? 38 : 24 }}
              >
                {item.title}
              </div>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-stone-800">
                <div className="font-bold leading-tight" style={{ fontFamily: HAND, fontSize: depth === 0 ? 64 : 32 }}>
                  {item.title}
                </div>
                <div className="mt-2 text-stone-600" style={{ fontSize: depth === 0 ? 26 : 15 }}>
                  {childCount > 0 ? `${childCount} inside — zoom in` : "empty — zoom in and add things"}
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
            <div className="px-3 pb-2 pt-6 text-stone-800">
              <div className="font-bold leading-tight" style={{ fontFamily: HAND, fontSize: 18 }}>
                {item.title}
              </div>
              {item.text && <div className="mt-1 line-clamp-3 text-sm leading-snug">{item.text}</div>}
            </div>
          )}
        </div>

        {item.kind === "note" && (
          <div
            className="pointer-events-none absolute bottom-0 right-0"
            style={{ width: 18, height: 18, background: "linear-gradient(to bottom right, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 50%)" }}
          />
        )}

        {(selected || linkTarget) && (
          <div
            className={`pointer-events-none absolute -inset-1.5 rounded-md border-4 ${linkTarget ? "border-red-500" : "border-sky-500"}`}
          />
        )}

        <div className="pointer-events-none absolute left-1/2 top-1 h-4 w-4 -translate-x-1/2 rounded-full bg-red-600 ring-2 ring-red-300" style={{ boxShadow: "1px 2px 3px rgba(0,0,0,0.5)" }} />
      </div>
    </div>
  );
}
