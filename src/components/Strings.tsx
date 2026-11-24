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
  scale = 1,
}: {
  links: Link[];
  items: Map<string, Item>;
  visible: Set<string>;
  whiteboard?: boolean;
  /** The camera zoom: when zoomed out, lines, dots and labels are drawn bigger (in the world) so they stay readable. */
  scale?: number;
}) {
  const fallback = whiteboard ? "#2563eb" : "#b91c1c";
  // never thinner than about 1.8px on screen, labels never smaller than about 11px
  const line = Math.max(4, 1.8 / scale);
  const dot = Math.max(6, 3.5 / scale);
  const labelSize = Math.max(18, 11 / scale);
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
              <path d={d} transform="translate(3 4)" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={line} strokeLinecap="round" />
            )}
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={line}
              strokeLinecap="round"
              strokeDasharray={style === "dashed" ? "14 12" : undefined}
            />
            {style === "arrow" ? (
              <polygon points={`${q.x},${q.y} ${head(-1)} ${head(1)}`} fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round" />
            ) : whiteboard || style !== "string" ? (
              <>
                <circle cx={p.x} cy={p.y} r={dot} fill={color} />
                <circle cx={q.x} cy={q.y} r={dot} fill={color} />
              </>
            ) : null}
            {l.label && (
              <text
                x={lx}
                y={ly - 8 * (labelSize / 18)}
                textAnchor="middle"
                fontSize={labelSize}
                fontWeight={700}
                fill="#1c1917"
                stroke="rgba(255,255,255,0.92)"
                strokeWidth={Math.max(5, labelSize * 0.28)}
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
