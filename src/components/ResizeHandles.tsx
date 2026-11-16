import type { Item } from "@/lib/types";

export type Corner = "nw" | "ne" | "sw" | "se";

const CURSORS: Record<Corner, string> = {
  nw: "cursor-nwse-resize",
  se: "cursor-nwse-resize",
  ne: "cursor-nesw-resize",
  sw: "cursor-nesw-resize",
};

/** Four corner grips for the selected item, sized to stay finger-friendly at any zoom. */
export default function ResizeHandles({ item, scale }: { item: Item; scale: number }) {
  const size = 28 / scale;
  return (
    <>
      {(["nw", "ne", "sw", "se"] as Corner[]).map((c) => (
        <div
          key={c}
          data-resize={c}
          data-resize-id={item.id}
          className={`absolute rounded-full border-sky-500 bg-white ${CURSORS[c]}`}
          style={{
            left: (c.includes("w") ? item.x : item.x + item.w) - size / 2,
            top: (c.includes("n") ? item.y : item.y + item.h) - size / 2,
            width: size,
            height: size,
            borderWidth: 3 / scale,
            borderStyle: "solid",
            boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
            zIndex: 60,
          }}
        />
      ))}
    </>
  );
}
