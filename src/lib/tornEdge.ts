/**
 * A torn paper edge for the drawers, drawn as a tall repeating SVG strip: the page's own edge (a rough line built
 * from several layers of smooth noise, big lumps down to fine roughness) with a pale fibrous rim along it where the
 * paper's core shows through, plus a soft shadow. Pure: the same seed always gives the same edge, and the noise wraps
 * round so the strip tiles with no seam. The paper's straight edge sits at x = 1, so the tear only ever sticks out past
 * it and there is never a hairline gap.
 */
export const EDGE_WIDTH = 22;
export const EDGE_HEIGHT = 1000;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth, repeating noise in -1..1: random values on a lattice that wraps round, eased between. */
function periodicNoise(rand: () => number, cells: number): (y: number) => number {
  const lattice = Array.from({ length: cells }, () => rand() * 2 - 1);
  return (y) => {
    const t = (((y / EDGE_HEIGHT) * cells) % cells + cells) % cells;
    const i = Math.floor(t);
    const f = t - i;
    const e = f * f * (3 - 2 * f);
    return lattice[i] * (1 - e) + lattice[(i + 1) % cells] * e;
  };
}

const q = (v: number) => Math.round(v * 10) / 10;

/** The two outlines of one tile: the page edge, and the outer edge of the pale rim. Both close back against x = 0. */
export function tornEdgePaths(seed: number): { body: string; rim: string } {
  const rand = mulberry32(seed);
  // wavelength 200, 100, 40, 20, 10 px (each divides the tile height), and how far each swings the edge
  const octaves = [
    { noise: periodicNoise(rand, 5), amp: 4.2 },
    { noise: periodicNoise(rand, 10), amp: 2.6 },
    { noise: periodicNoise(rand, 25), amp: 1.6 },
    { noise: periodicNoise(rand, 50), amp: 1.0 },
    { noise: periodicNoise(rand, 100), amp: 0.7 },
  ];
  const rimNoise = [periodicNoise(rand, 33), periodicNoise(rand, 100)];
  // a few thin fibres that stick out past the rim
  const fibres = Array.from({ length: 16 }, () => ({ at: rand() * EDGE_HEIGHT, width: 3 + rand() * 5, reach: 2.5 + rand() * 4 }));

  const step = 2;
  const body: string[] = [];
  const rim: string[] = [];
  for (let y = 0; y <= EDGE_HEIGHT; y += step) {
    const wrapped = y === EDGE_HEIGHT ? 0 : y; // the last point matches the first, so tiles join
    let edge = 6.5;
    for (const o of octaves) edge += o.noise(wrapped) * o.amp;
    edge += (rand() - 0.5) * 0.7; // paper fuzz
    edge = Math.min(Math.max(edge, 1.3), 13.5);
    let thick = 1.6 + (rimNoise[0](wrapped) * 0.5 + 0.5) * 2.2 + (rimNoise[1](wrapped) * 0.5 + 0.5) * 1.2;
    for (const f of fibres) {
      const d = (wrapped - f.at) / f.width;
      thick += f.reach * Math.exp(-d * d);
    }
    const outer = Math.min(edge + thick, EDGE_WIDTH - 3);
    body.push(`${q(edge)} ${q(y)}`);
    rim.push(`${q(outer)} ${q(y)}`);
  }
  const close = (pts: string[]) => `M0 0L${pts.join("L")}L0 ${EDGE_HEIGHT}Z`;
  return { body: close(body), rim: close(rim) };
}

/** A CSS `url(...)` for the strip: `paper` for the page, `fibre` for the rim where it tore, `shadow` for the soft shadow. */
export function tornEdgeImage(seed: number, paper: string, fibre: string, shadow: string): string {
  const { body, rim } = tornEdgePaths(seed);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${EDGE_WIDTH}" height="${EDGE_HEIGHT}" viewBox="0 0 ${EDGE_WIDTH} ${EDGE_HEIGHT}">` +
    `<defs><path id="r" d="${rim}"/><path id="b" d="${body}"/>` +
    `<filter id="s" x="-20%" y="0" width="160%" height="100%"><feGaussianBlur stdDeviation="1.2"/></filter></defs>` +
    `<use href="#r" fill="${shadow}" filter="url(#s)" transform="translate(1.6 0.8)"/>` +
    `<use href="#r" fill="${fibre}"/>` +
    `<use href="#b" fill="${paper}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
