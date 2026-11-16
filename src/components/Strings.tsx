import { pinPoint } from "@/lib/board";
import type { Item, Link } from "@/lib/types";

/** Red string between pins, sagging a little under gravity. */
export default function Strings({
  links,
  items,
  visible,
}: {
  links: Link[];
  items: Map<string, Item>;
  visible: Set<string>;
}) {
  return (
    <svg
      width={1}
      height={1}
      className="pointer-events-none absolute left-0 top-0 overflow-visible"
      style={{ zIndex: 50 }}
    >
      {links.map((l) => {
        const a = items.get(l.from);
        const b = items.get(l.to);
        if (!a || !b || !visible.has(a.id) || !visible.has(b.id)) return null;
        const p = pinPoint(a);
        const q = pinPoint(b);
        const dist = Math.hypot(q.x - p.x, q.y - p.y);
        const sag = Math.min(160, 20 + dist * 0.12);
        const d = `M ${p.x} ${p.y} Q ${(p.x + q.x) / 2} ${(p.y + q.y) / 2 + sag} ${q.x} ${q.y}`;
        return (
          <g key={l.id}>
            <path d={d} transform="translate(3 4)" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={4} strokeLinecap="round" />
            <path d={d} fill="none" stroke="#b91c1c" strokeWidth={4} strokeLinecap="round" />
          </g>
        );
      })}
    </svg>
  );
}
