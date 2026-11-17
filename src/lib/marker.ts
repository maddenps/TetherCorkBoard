/**
 * Hand-drawn marker outlines for the whiteboard view. Pure and seeded by the item id, so an item always keeps
 * the same wobble (and can be unit tested): the line drifts and bows, the corners are rounded off unevenly,
 * and the end of the stroke overshoots the start the way a real loop never quite closes.
 */

type Pt = [number, number];

function hash(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** SVG path through the points as a smooth Catmull-Rom curve (open, not closed). */
function smooth(pts: Pt[]): string {
  let d = `M ${pts[1][0].toFixed(1)} ${pts[1][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 2; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/**
 * One wobbly pass around a w x h rectangle. `messiness` scales every kind of error (1 is normal).
 * Different `pass` numbers give different wobble, for a second, slightly off retrace of the same shape.
 */
export function scribblePath(w: number, h: number, id: string, pass = 0, messiness = 1): string {
  const r = rng(hash(id) + pass * 7919);
  const j = (amp: number) => (r() - 0.5) * 2 * amp;
  const m = messiness;
  const inset = 4;
  const corners: Pt[] = [
    [inset, inset],
    [w - inset, inset],
    [w - inset, h - inset],
    [inset, h - inset],
  ];

  // Each side gets its own lean (the hand doesn't stay straight) and a bow.
  const pts: Pt[] = [];
  const startShift: Pt = [j(7 * m), j(7 * m)];
  for (let s = 0; s < 4; s++) {
    const a = corners[s];
    const b = corners[(s + 1) % 4];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const steps = Math.max(2, Math.round(len / 38));
    const bow = j((3 + len * 0.02) * m);
    const lean = j((2 + len * 0.012) * m);
    const wave = 0.6 + r() * 1.2; // how many wiggles along this side
    const phase = r() * Math.PI * 2;
    for (let k = 0; k < steps; k++) {
      const t = k / steps;
      let off = bow * Math.sin(Math.PI * t) + lean * t + Math.sin(t * Math.PI * 2 * wave + phase) * 1.6 * m + j(1.4 * m);
      // The corners are where it gets sloppy: pulled in, pushed out, never quite square.
      if (k === 0) off += j(6 * m);
      const cornerPull = k === 0 ? 5 * m : 0;
      pts.push([
        a[0] + dx * t + nx * off + (dx / len) * cornerPull + j(1.5 * m) + (s === 0 && k === 0 ? startShift[0] : 0),
        a[1] + dy * t + ny * off + (dy / len) * cornerPull + j(1.5 * m) + (s === 0 && k === 0 ? startShift[1] : 0),
      ]);
    }
  }

  // The stroke ends past where it began, crossing the start (and sometimes missing it).
  const gap = j(8 * m);
  pts.push([pts[0][0] + gap, pts[0][1] + j(5 * m)], [pts[1][0] + j(10 * m), pts[1][1] + gap * 0.6]);

  // Catmull-Rom needs a phantom point at each end.
  return smooth([pts[0], ...pts, pts[pts.length - 1]]);
}
