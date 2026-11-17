import { pinPoint } from "@/lib/board";
import type { Item, Link } from "@/lib/types";

/**
 * Connectors between items. The default is red string sagging a little under gravity; a link can instead be a
 * straight line, a dashed line or an arrow, in any colour, with a label.
 */
export default function Strings({
  links,
  items,
  visible,
  whiteboard = false,
}: {
  links: Link[];
  items: Map<string, Item>;
  visible: Set<string>;
  whiteboard?: boolean;
}) {
  const fallback = whiteboard ? "#2563eb" : "#b91c1c";
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
        const style = l.style ?? "string";
        const color = l.color ?? fallback;
        const dist = Math.hypot(q.x - p.x, q.y - p.y);
        const sag = style === "string" ? Math.min(160, 20 + dist * 0.12) : 0;
        const mx = (p.x + q.x) / 2;
        const my = (p.y + q.y) / 2 + sag;
        const d = sag ? `M ${p.x} ${p.y} Q ${mx} ${my} ${q.x} ${q.y}` : `M ${p.x} ${p.y} L ${q.x} ${q.y}`;
        // Where the label sits (the middle of the curve) and which way the arrowhead points.
        const lx = sag ? (p.x + 2 * mx + q.x) / 4 : mx;
        const ly = sag ? (p.y + 2 * my + q.y) / 4 : my;
        const ang = Math.atan2(q.y - (sag ? my : p.y), q.x - (sag ? mx : p.x));
        const head = (side: number) =>
          `${q.x - Math.cos(ang + side * 0.45) * 26},${q.y - Math.sin(ang + side * 0.45) * 26}`;
        return (
          <g key={l.id}>
            {!whiteboard && style === "string" && (
              <path d={d} transform="translate(3 4)" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={4} strokeLinecap="round" />
            )}
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={style === "dashed" ? "14 12" : undefined}
            />
            {style === "arrow" ? (
              <polygon points={`${q.x},${q.y} ${head(-1)} ${head(1)}`} fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round" />
            ) : whiteboard || style !== "string" ? (
              <>
                <circle cx={p.x} cy={p.y} r={6} fill={color} />
                <circle cx={q.x} cy={q.y} r={6} fill={color} />
              </>
            ) : null}
            {l.label && (
              <text
                x={lx}
                y={ly - 8}
                textAnchor="middle"
                fontSize={18}
                fontWeight={700}
                fill="#1c1917"
                stroke="rgba(255,255,255,0.92)"
                strokeWidth={5}
                paintOrder="stroke"
                strokeLinejoin="round"
              >
                {l.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
