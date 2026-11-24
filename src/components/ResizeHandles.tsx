import type { Item } from "@/lib/types";

export type Corner = "nw" | "ne" | "sw" | "se";
/** Every grip: the four corners resize both ways, the four edges resize one way. */
export type Grip = Corner | "n" | "s" | "e" | "w";

const CURSORS: Record<Grip, string> = {
  nw: "cursor-nwse-resize",
  se: "cursor-nwse-resize",
  ne: "cursor-nesw-resize",
  sw: "cursor-nesw-resize",
  n: "cursor-ns-resize",
  s: "cursor-ns-resize",
  e: "cursor-ew-resize",
  w: "cursor-ew-resize",
};

interface Props {
  item: Item;
  scale: number;
  /** Draw the move grip and settings button (left out of the copy that is drawn above the edit card). */
  toolbar?: boolean;
  onSettings?: () => void;
}

/** Move / settings: just the icon, no button chrome. Dim at rest, brighter and a little bigger under the mouse, nearly black while pressed. */
const toolButton =
  "flex items-center justify-center rounded-full bg-transparent text-stone-700 opacity-70 transition duration-150 hover:scale-125 hover:opacity-100 active:scale-100 active:text-black active:opacity-100";
/** A pale halo so a dark icon stays readable on any paper colour. */
const halo = { filter: "drop-shadow(0 0 2px rgba(255,255,255,0.95)) drop-shadow(0 0 5px rgba(255,255,255,0.7))" } as const;

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-3/4 w-3/4",
  style: halo,
  "aria-hidden": true,
} as const;

/** Four-way arrow (Lucide "move", ISC licence). */
function MoveIcon() {
  return (
    <svg {...svgProps}>
      <polyline points="5 9 2 12 5 15" />
      <polyline points="9 5 12 2 15 5" />
      <polyline points="15 19 12 22 9 19" />
      <polyline points="19 9 22 12 19 15" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <line x1="12" x2="12" y1="2" y2="22" />
    </svg>
  );
}

/** Cog (Lucide "settings", ISC licence). */
function GearIcon() {
  return (
    <svg {...svgProps}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** The selection frame and its grips sit this far (screen px) outside the item's edge, so the edge itself stays visible. */
const GAP = 20;

/**
 * What the selected item shows: corner and edge grips to resize, a big Move grip to drag it by, and a settings button.
 * Everything keeps a fixed size on screen at any zoom, so it stays finger-friendly.
 */
export default function ResizeHandles({ item, scale, toolbar = true, onSettings }: Props) {
  const size = 28 / scale;
  const bar = 16 / scale;
  const barLen = 56 / scale;
  const resizable = item.kind !== "pin";
  // Edge grips only appear when the edge is long enough on screen not to crowd the corners.
  const showH = item.w * scale >= 120;
  const showV = item.h * scale >= 120;
  const edges: Grip[] = [...(showH ? (["n", "s"] as Grip[]) : []), ...(showV ? (["e", "w"] as Grip[]) : [])];
  const common = { borderColor: "#0ea5e9", borderStyle: "solid", boxShadow: "0 1px 4px rgba(0,0,0,0.4)", zIndex: 60 } as const;
  const cx = item.x + item.w / 2;
  const off = GAP / scale;
  const isPin = item.kind === "pin";
  // Icon sizes (screen px) shrink on a small item so they always fit inside it.
  const small = Math.min(item.w, item.h) * scale;
  const moveSize = Math.round(Math.min(80, Math.max(30, small * 0.45)));
  const cogSize = Math.round(Math.min(52, Math.max(26, small * 0.28)));
  // The link / photo icons already sit in the top-right corner, so the cog goes just under them.
  const cornerIcons = !!item.url || (item.photos?.length ?? 0) > 0;

  return (
    <>
      {resizable && (
        // The selection frame: kicked out past the item's edge, with the grips sitting on it.
        <div
          className="pointer-events-none absolute"
          style={{
            left: item.x - off,
            top: item.y - off,
            width: item.w + 2 * off,
            height: item.h + 2 * off,
            border: `${5 / scale}px solid #0ea5e9`,
            borderRadius: 8 / scale,
            zIndex: 59,
          }}
        />
      )}
      {resizable &&
        (["nw", "ne", "sw", "se"] as Corner[]).map((c) => (
          <div
            key={c}
            data-resize={c}
            data-resize-id={item.id}
            className={`absolute rounded-full bg-white ${CURSORS[c]}`}
            style={{
              ...common,
              // Centred a little outside the corner, so the corner itself can still be seen.
              left: (c.includes("w") ? item.x - off : item.x + item.w + off) - size / 2,
              top: (c.includes("n") ? item.y - off : item.y + item.h + off) - size / 2,
              width: size,
              height: size,
              borderWidth: 3.5 / scale,
            }}
          />
        ))}
      {resizable &&
        edges.map((g) => {
          const horizontal = g === "n" || g === "s";
          return (
            <div
              key={g}
              data-resize={g}
              data-resize-id={item.id}
              className={`absolute bg-white ${CURSORS[g]}`}
              style={{
                ...common,
                left: horizontal ? cx - barLen / 2 : (g === "w" ? item.x - off : item.x + item.w + off) - bar / 2,
                top: horizontal ? (g === "n" ? item.y - off : item.y + item.h + off) - bar / 2 : item.y + item.h / 2 - barLen / 2,
                width: horizontal ? barLen : bar,
                height: horizontal ? bar : barLen,
                borderWidth: 3 / scale,
                borderRadius: bar / 2,
              }}
            />
          );
        })}

      {toolbar && !isPin && (
        <>
          {/* The big grab handle, centred in the item: drag from anywhere on it to move the item and everything inside it. */}
          <div className="absolute" style={{ left: cx, top: item.y + item.h / 2, width: 0, height: 0, zIndex: 61 }}>
            <div className="absolute left-0 top-0" style={{ transform: `scale(${1 / scale}) translate(-50%, -50%)`, transformOrigin: "0 0" }}>
              <div
                data-move={item.id}
                className={`${toolButton} cursor-grab touch-none active:cursor-grabbing`}
                style={{ width: moveSize, height: moveSize }}
                title="Drag to move"
              >
                <MoveIcon />
              </div>
            </div>
          </div>
          {/* Settings: the top-right corner (under the link / photo icons when there are any). */}
          <div
            className="absolute"
            style={{
              left: item.x + item.w - 10 / scale,
              top: item.y + (cornerIcons ? 40 : 10 / scale),
              width: 0,
              height: 0,
              zIndex: 61,
            }}
          >
            <div className="absolute left-0 top-0" style={{ transform: `scale(${1 / scale}) translate(-100%, 0)`, transformOrigin: "0 0" }}>
              <button
                className={toolButton}
                style={{ width: cogSize, height: cogSize }}
                aria-label="Open settings"
                title="Settings"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onSettings}
              >
                <GearIcon />
              </button>
            </div>
          </div>
        </>
      )}

      {toolbar && isPin && (
        // A pin is too small to hold them, so its buttons sit just above it.
        <div className="absolute" style={{ left: cx, top: item.y - 8 / scale, width: 0, height: 0, zIndex: 61 }}>
          <div
            className="absolute bottom-0 left-0 flex gap-3 whitespace-nowrap"
            style={{ transform: `scale(${1 / scale}) translateX(-50%)`, transformOrigin: "0 100%" }}
          >
            <div data-move={item.id} className={`${toolButton} h-12 w-12 cursor-grab touch-none active:cursor-grabbing`} title="Drag to move">
              <MoveIcon />
            </div>
            <button className={`${toolButton} h-12 w-12`} aria-label="Open settings" title="Settings" onPointerDown={(e) => e.stopPropagation()} onClick={onSettings}>
              <GearIcon />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
