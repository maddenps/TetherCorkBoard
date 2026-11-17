/**
 * Whiteboard surface, painted once at startup (no image download, works offline): the leftovers of earlier
 * use that never quite wipe off. Faded "old work" (a table, a bulleted list, a little flow chart, a circled
 * note with an arrow, some ruled lines) that the eraser mostly got, then soft smears, haze and dust on top.
 * It is transparent, so it sits on the flat board colour, and it tiles seamlessly. The tile is big so the same
 * old work isn't seen repeating every few screens.
 */

const SIZE = 2048;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = [number, number];

export function createWhiteboardTexture(): string | null {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const rand = mulberry32(9137);
    const between = (a: number, b: number) => a + rand() * (b - a);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    /** Runs `draw` at the 9 neighbouring offsets so anything crossing an edge wraps around. */
    const wrapped = (draw: () => void) => {
      for (const ox of [-SIZE, 0, SIZE]) {
        for (const oy of [-SIZE, 0, SIZE]) {
          ctx.save();
          ctx.translate(ox, oy);
          draw();
          ctx.restore();
        }
      }
    };

    // ---- Old marker work ----
    const inks = ["40,50,70", "37,99,235", "190,40,40", "21,128,61", "30,30,30"];
    let ink = inks[0];
    let alpha = 0.1;
    let width = 3;

    /** Points along a slightly wavering line. */
    const line = (a: Pt, b: Pt): Pt[] => {
      const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 22));
      const bow = (rand() - 0.5) * 8;
      const pts: Pt[] = [];
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        pts.push([a[0] + (b[0] - a[0]) * t + (rand() - 0.5) * 1.6, a[1] + (b[1] - a[1]) * t + Math.sin(t * Math.PI) * bow + (rand() - 0.5) * 1.6]);
      }
      return pts;
    };
    const draw = (pts: Pt[], w = width, a = alpha) => {
      wrapped(() => {
        ctx.strokeStyle = `rgba(${ink},${a})`;
        ctx.lineWidth = w;
        ctx.beginPath();
        pts.forEach(([x, y], k) => (k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
        ctx.stroke();
      });
    };
    const rect = (x: number, y: number, w: number, h: number) => {
      draw([...line([x, y], [x + w, y]), ...line([x + w, y], [x + w, y + h]), ...line([x + w, y + h], [x, y + h]), ...line([x, y + h], [x - 2, y - 3])]);
    };
    const arrow = (a: Pt, b: Pt) => {
      draw(line(a, b));
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (const side of [-1, 1]) {
        draw([b, [b[0] - Math.cos(ang + side * 0.5) * 16, b[1] - Math.sin(ang + side * 0.5) * 16]]);
      }
    };
    /** A line of "writing": runs of short dashes with word gaps, so it reads as text without being letters. */
    const textLine = (x: number, y: number, length: number) => {
      let px = x;
      while (px < x + length) {
        const seg = between(14, 46);
        draw([[px, y + (rand() - 0.5) * 2], [Math.min(px + seg, x + length), y + (rand() - 0.5) * 2]], width * 0.85);
        px += seg + between(9, 16);
      }
    };
    const palette = () => {
      ink = inks[Math.floor(rand() * inks.length)];
      alpha = between(0.09, 0.15);
      width = between(2.6, 3.6);
    };

    const spot = (): Pt => [between(0, SIZE), between(0, SIZE)];

    // A table: ruled grid with a heavier header row and a bit of writing in some cells.
    for (let i = 0; i < 3; i++) {
      palette();
      const [x, y] = spot();
      const cols = 3 + Math.floor(rand() * 2);
      const rows = 3 + Math.floor(rand() * 3);
      const cw = between(120, 170);
      const rh = between(46, 60);
      for (let r = 0; r <= rows; r++) draw(line([x, y + r * rh], [x + cols * cw, y + r * rh]), r === 1 ? width * 1.5 : width);
      for (let c = 0; c <= cols; c++) draw(line([x + c * cw, y], [x + c * cw, y + rows * rh]));
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (rand() < 0.7) textLine(x + c * cw + 12, y + r * rh + rh * 0.62, between(40, cw - 30));
    }

    // A titled, bulleted list.
    for (let i = 0; i < 4; i++) {
      palette();
      const [x, y] = spot();
      const titleLen = between(120, 220);
      textLine(x, y, titleLen);
      draw(line([x - 6, y + 14], [x + titleLen + 10, y + 14]), width * 1.3);
      const items = 3 + Math.floor(rand() * 4);
      for (let k = 0; k < items; k++) {
        const ly = y + 52 + k * 40;
        draw([[x + 6, ly], [x + 7, ly + 0.5]], width * 2.2);
        textLine(x + 28, ly, between(70, 240));
      }
    }

    // A small flow chart: boxes joined by arrows.
    for (let i = 0; i < 4; i++) {
      palette();
      const [x, y] = spot();
      const n = 2 + Math.floor(rand() * 2);
      const bw = between(100, 140);
      const bh = between(54, 70);
      const gap = between(50, 80);
      const down = rand() < 0.4;
      for (let k = 0; k < n; k++) {
        const bx = down ? x : x + k * (bw + gap);
        const by = down ? y + k * (bh + gap) : y;
        rect(bx, by, bw, bh);
        textLine(bx + 14, by + bh / 2, bw - 28);
        if (k < n - 1) arrow(down ? [bx + bw / 2, by + bh + 4] : [bx + bw + 4, by + bh / 2], down ? [bx + bw / 2, by + bh + gap - 6] : [bx + bw + gap - 6, by + bh / 2]);
      }
    }

    // A circled word with an arrow pointing at it.
    for (let i = 0; i < 4; i++) {
      palette();
      const [x, y] = spot();
      const rx = between(60, 100);
      const ry = between(26, 38);
      const pts: Pt[] = [];
      for (let a = 0; a <= Math.PI * 2.15; a += 0.3) pts.push([x + Math.cos(a) * (rx + a * 2), y + Math.sin(a) * (ry + a)]);
      draw(pts);
      textLine(x - rx * 0.6, y, rx * 1.2);
      arrow([x + rx + 110, y - 60], [x + rx + 10, y - 8]);
    }

    // Long ruled lines and underlines.
    for (let i = 0; i < 6; i++) {
      palette();
      const [x, y] = spot();
      draw(line([x, y], [x + between(260, 560), y + between(-10, 10)]), width * 1.2);
    }

    // ---- The eraser: broad swipes that take most of the old work back out ----
    ctx.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 70; i++) {
      const x = rand() * SIZE;
      const y = rand() * SIZE;
      const len = between(260, 620);
      const ang = (rand() - 0.5) * 0.6 + (rand() < 0.5 ? 0 : Math.PI);
      const bend = (rand() - 0.5) * 140;
      const w = between(40, 90);
      const ex = x + Math.cos(ang) * len;
      const ey = y + Math.sin(ang) * len;
      const cx = (x + ex) / 2 - Math.sin(ang) * bend;
      const cy = (y + ey) / 2 + Math.cos(ang) * bend;
      wrapped(() => {
        for (let pass = 0; pass < 4; pass++) {
          ctx.strokeStyle = `rgba(0,0,0,${0.22 + pass * 0.1})`;
          ctx.lineWidth = w * (1 - pass * 0.2);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(cx, cy, ex, ey);
          ctx.stroke();
        }
      });
    }
    ctx.globalCompositeOperation = "source-over";

    // ---- Haze, smears and dust ----
    for (let i = 0; i < 36; i++) {
      const x = rand() * SIZE;
      const y = rand() * SIZE;
      const r = between(150, 340);
      const a = between(0.025, 0.06);
      wrapped(() => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(120,135,150,${a})`);
        g.addColorStop(1, "rgba(120,135,150,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      });
    }
    for (let i = 0; i < 45; i++) {
      const x = rand() * SIZE;
      const y = rand() * SIZE;
      const len = between(200, 460);
      const ang = (rand() - 0.5) * 0.9 + (rand() < 0.5 ? 0 : Math.PI);
      const bend = (rand() - 0.5) * 160;
      const w = between(34, 80);
      const a = between(0.03, 0.065);
      const ex = x + Math.cos(ang) * len;
      const ey = y + Math.sin(ang) * len;
      const cx = (x + ex) / 2 - Math.sin(ang) * bend;
      const cy = (y + ey) / 2 + Math.cos(ang) * bend;
      wrapped(() => {
        for (let pass = 0; pass < 5; pass++) {
          ctx.strokeStyle = `rgba(110,125,140,${a * (0.35 + pass * 0.18)})`;
          ctx.lineWidth = w * (1 - pass * 0.17);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(cx, cy, ex, ey);
          ctx.stroke();
        }
      });
    }
    for (let i = 0; i < 6500; i++) {
      const x = rand() * SIZE;
      const y = rand() * SIZE;
      const r = between(0.5, 1.8);
      const dust = rand() < 0.5 ? "90,100,115" : inks[Math.floor(rand() * inks.length)];
      ctx.fillStyle = `rgba(${dust},${between(0.04, 0.12)})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      // Specks near an edge are repeated across it so the tile still joins up.
      if (x < 4) {
        ctx.beginPath();
        ctx.arc(x + SIZE, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (y < 4) {
        ctx.beginPath();
        ctx.arc(x, y + SIZE, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    return canvas.toDataURL("image/png");
  } catch {
    return null; // Falls back to the plain white surface.
  }
}

export const WHITEBOARD_TILE_SIZE = SIZE;
