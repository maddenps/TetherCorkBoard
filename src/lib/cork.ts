/**
 * Paints a seamless cork-board texture once at startup (no image download, works offline).
 * Layers: low-frequency tan/brown mottling, fine grain, dark and light granules.
 */

const SIZE = 768;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Value noise on a lattice that wraps every `period` cells, so the tile repeats seamlessly. */
function periodicNoise(period: number, rand: () => number): (x: number, y: number) => number {
  const grid = new Float32Array(period * period);
  for (let i = 0; i < grid.length; i++) grid[i] = rand();
  const at = (cx: number, cy: number) => grid[(((cy % period) + period) % period) * period + (((cx % period) + period) % period)];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = (x / SIZE) * period;
    const fy = (y / SIZE) * period;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = smooth(fx - x0);
    const ty = smooth(fy - y0);
    const top = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx;
    const bottom = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
    return top * (1 - ty) + bottom * ty;
  };
}

export function createCorkTexture(): string | null {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const rand = mulberry32(1987);

    const n1 = periodicNoise(4, rand);
    const n2 = periodicNoise(12, rand);
    const n3 = periodicNoise(36, rand);
    const n4 = periodicNoise(96, rand);

    const img = ctx.createImageData(SIZE, SIZE);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const m = n1(x, y) * 0.35 + n2(x, y) * 0.3 + n3(x, y) * 0.22 + n4(x, y) * 0.13;
        const t = Math.min(1, Math.max(0, (m - 0.25) / 0.5));
        const grain = (rand() - 0.5) * 30;
        const i = (y * SIZE + x) * 4;
        img.data[i] = 206 + t * 30 + grain;
        img.data[i + 1] = 166 + t * 28 + grain * 0.9;
        img.data[i + 2] = 118 + t * 24 + grain * 0.7;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    const blob = (x: number, y: number, r: number, color: string) => {
      ctx.fillStyle = color;
      for (const ox of [-SIZE, 0, SIZE]) {
        for (const oy of [-SIZE, 0, SIZE]) {
          const px = x + ox;
          const py = y + oy;
          if (px < -r || py < -r || px > SIZE + r || py > SIZE + r) continue;
          ctx.beginPath();
          ctx.ellipse(px, py, r, r * (0.6 + rand() * 0.5), rand() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    for (let i = 0; i < 3200; i++) blob(rand() * SIZE, rand() * SIZE, 0.6 + rand() * 1.9, `rgba(120,82,50,${0.25 + rand() * 0.4})`);
    for (let i = 0; i < 2400; i++) blob(rand() * SIZE, rand() * SIZE, 0.6 + rand() * 1.8, `rgba(240,214,176,${0.25 + rand() * 0.4})`);
    for (let i = 0; i < 40; i++) blob(rand() * SIZE, rand() * SIZE, 2 + rand() * 3.5, `rgba(70,40,20,${0.1 + rand() * 0.12})`);

    return canvas.toDataURL("image/png");
  } catch {
    return null; // Falls back to the flat cork colour.
  }
}

export const CORK_TILE_SIZE = SIZE;
