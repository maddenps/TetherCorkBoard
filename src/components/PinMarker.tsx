import type { Item } from "@/lib/types";

interface Props {
  item: Item;
  visible: boolean;
  depth: number;
  selected: boolean;
  linkTarget: boolean;
}

/**
 * A map pin: a coloured teardrop with an emoji in its head and its label underneath. It marks a spot on a map
 * (the section it sits in) and can be connected to the section it stands for, instead of that section being
 * placed right on top of the map.
 */
export default function PinMarker({ item, visible, depth, selected, linkTarget }: Props) {
  const color = item.color || "#dc2626";
  return (
    <div
      data-item-id={visible ? item.id : undefined}
      className="absolute"
      style={{
        left: item.x,
        top: item.y,
        width: item.w,
        height: item.h,
        zIndex: depth * 2 + 1,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 250ms",
      }}
    >
      <div className="relative h-full w-full" style={{ filter: "drop-shadow(1px 3px 3px rgba(0,0,0,0.45))" }}>
        <svg width={40} height={52} viewBox="0 0 40 52" className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
          <path
            d="M20 50 C20 50 3 30 3 19 a17 17 0 1 1 34 0 C37 30 20 50 20 50 Z"
            fill={color}
            stroke="rgba(255,255,255,0.9)"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <circle cx={20} cy={19} r={11.5} fill="rgba(255,255,255,0.92)" />
        </svg>
        <div
          className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center justify-center text-center leading-none"
          style={{ top: 9, width: 24, height: 24, fontSize: 17 }}
        >
          {item.icon || "📍"}
        </div>
        <div
          className="pointer-events-none absolute left-1/2 max-w-full -translate-x-1/2 truncate rounded px-2 py-0.5 text-sm font-bold text-stone-900"
          style={{ top: 56, background: "rgba(255,255,255,0.9)", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
        >
          {item.title || "Pin"}
        </div>
        {(selected || linkTarget) && (
          <div
            className={`pointer-events-none absolute -inset-1 rounded-md border-4 ${linkTarget ? "border-red-500" : "border-sky-500"}`}
          />
        )}
      </div>
    </div>
  );
}
