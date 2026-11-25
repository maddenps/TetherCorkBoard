import type { Board, Item, ItemKind, View } from "./types";

/**
 * Semantic zoom: a SECTION at hierarchy depth d is only shown once the board scale reaches THRESHOLDS[d]. Depth 0
 * (top-level sections) and depth 1 are always visible, so the second layer can be seen even when the whole board is on
 * screen. Anything that is not a section (notes, photos, pins) is shown whenever the section it is in is shown (see
 * computeVisible), so a note never hides inside a visible section.
 */
export const THRESHOLDS = [0, 0, 0.3, 0.9, 1.6];
export const MIN_SCALE = 0.08;
export const MAX_SCALE = 4;

export const PAPER_COLORS = ["#fff4a3", "#ffd0dc", "#c9eab8", "#c6e2ff", "#e6d4ff", "#ffffff"];

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function thresholdFor(depth: number): number {
  return THRESHOLDS[Math.min(depth, THRESHOLDS.length - 1)];
}

/**
 * Which items are shown at a zoom. Sections follow THRESHOLDS by depth; a note, photo or pin is shown as soon as the
 * section it is in is shown (or its own depth threshold is reached, for one that sits at the top level). `ordered` must
 * list parents before the things inside them (sort by depth).
 */
export function computeVisible(ordered: Item[], depths: Map<string, number>, scale: number): Set<string> {
  const shown = new Set<string>();
  for (const i of ordered) {
    const byZoom = scale >= thresholdFor(depths.get(i.id) ?? 0);
    if (i.kind === "section" ? byZoom : byZoom || (!!i.parentId && shown.has(i.parentId))) shown.add(i.id);
  }
  return shown;
}

/** Ids of the sections that directly hold at least one note, photo or pin: they always show what is inside them. */
export function sectionsHoldingThings(items: Item[]): Set<string> {
  const ids = new Set<string>();
  for (const i of items) if (i.parentId && i.kind !== "section") ids.add(i.parentId);
  return ids;
}

export function computeDepths(items: Item[]): Map<string, number> {
  const byId = new Map(items.map((i) => [i.id, i]));
  const depths = new Map<string, number>();
  for (const item of items) {
    let d = 0;
    let cur: Item | undefined = item;
    const seen = new Set<string>();
    while (cur?.parentId && byId.has(cur.parentId) && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = byId.get(cur.parentId);
      d++;
    }
    depths.set(item.id, d);
  }
  return depths;
}

export function descendantIds(items: Item[], id: string): Set<string> {
  const out = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const i of items) {
      if (i.parentId === cur && !out.has(i.id)) {
        out.add(i.id);
        stack.push(i.id);
      }
    }
  }
  return out;
}

export function defaultSize(kind: ItemKind, depth: number): { w: number; h: number } {
  if (kind === "section") {
    if (depth === 0) return { w: 900, h: 620 };
    if (depth === 1) return { w: 420, h: 300 };
    return { w: 340, h: 240 };
  }
  if (kind === "image") return { w: 240, h: 200 };
  if (kind === "pin") return { w: 130, h: 84 };
  return { w: 240, h: 150 };
}

export function boundsOf(items: Item[]): { x: number; y: number; w: number; h: number } {
  if (items.length === 0) return { x: 0, y: 0, w: 800, h: 600 };
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const i of items) {
    x1 = Math.min(x1, i.x);
    y1 = Math.min(y1, i.y);
    x2 = Math.max(x2, i.x + i.w);
    y2 = Math.max(y2, i.y + i.h);
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

const FIT_PAD = 32;

/**
 * The size an auto-fit section needs to hold what is inside it, with spare room on the right and bottom (too big is
 * better than too small). Null when there is nothing inside. A section with a map image only ever grows, so the map is never cropped.
 */
export function fitSectionSize(items: Item[], id: string): { w: number; h: number } | null {
  const sec = items.find((i) => i.id === id);
  const kids = items.filter((i) => i.parentId === id);
  if (!sec || kids.length === 0) return null;
  const right = Math.max(...kids.map((k) => k.x + k.w));
  const bottom = Math.max(...kids.map((k) => k.y + k.h));
  let w = Math.max(200, Math.ceil(right - sec.x + FIT_PAD));
  let h = Math.max(140, Math.ceil(bottom - sec.y + FIT_PAD));
  if (sec.mapData) {
    w = Math.max(w, sec.w);
    h = Math.max(h, sec.h);
  }
  return { w, h };
}

/** Resize every auto-fit section to its contents. Returns the same board when nothing needs to change. */
export function autoFitSections(board: Board): Board {
  let changed = false;
  const items = board.items.map((s) => {
    if (s.kind !== "section" || !s.autoFit) return s;
    const f = fitSectionSize(board.items, s.id);
    if (!f || (Math.abs(f.w - s.w) <= 0.5 && Math.abs(f.h - s.h) <= 0.5)) return s;
    changed = true;
    return { ...s, ...f };
  });
  return changed ? { ...board, updatedAt: Date.now(), items } : board;
}

export function clampScale(s: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
}

/** View that centres `rect` inside a viewport of the given size. */
export function fitView(
  rect: { x: number; y: number; w: number; h: number },
  viewport: { w: number; h: number },
  padding = 60,
  /** Space at the top that floating controls cover; the rect is fitted into what is left below it. */
  top = 0,
): View {
  const usable = Math.max(1, viewport.h - top);
  const scale = clampScale(Math.min((viewport.w - padding * 2) / rect.w, (usable - padding * 2) / rect.h));
  return {
    scale,
    x: viewport.w / 2 - (rect.x + rect.w / 2) * scale,
    y: top + usable / 2 - (rect.y + rect.h / 2) * scale,
  };
}

/** Move an item and everything inside it. */
export function moveItems(board: Board, id: string, dx: number, dy: number): Board {
  const ids = descendantIds(board.items, id);
  ids.add(id);
  return {
    ...board,
    updatedAt: Date.now(),
    items: board.items.map((i) => (ids.has(i.id) ? { ...i, x: i.x + dx, y: i.y + dy } : i)),
  };
}

/** After a drop, adopt the smallest section under the item's centre (or leave to top level). */
export function reparent(board: Board, id: string): Board {
  const item = board.items.find((i) => i.id === id);
  if (!item) return board;
  const blocked = descendantIds(board.items, id);
  blocked.add(id);
  const cx = item.x + item.w / 2;
  const cy = item.y + item.h / 2;
  let best: Item | null = null;
  for (const s of board.items) {
    if (s.kind !== "section" || blocked.has(s.id)) continue;
    if (cx < s.x || cx > s.x + s.w || cy < s.y || cy > s.y + s.h) continue;
    if (!best || s.w * s.h < best.w * best.h) best = s;
  }
  const parentId = best?.id ?? null;
  if (parentId === item.parentId) return board;
  return {
    ...board,
    updatedAt: Date.now(),
    items: board.items.map((i) => (i.id === id ? { ...i, parentId } : i)),
  };
}

export function removeItem(board: Board, id: string): Board {
  const gone = descendantIds(board.items, id);
  gone.add(id);
  return {
    ...board,
    updatedAt: Date.now(),
    items: board.items.filter((i) => !gone.has(i.id)),
    links: board.links.filter((l) => !gone.has(l.from) && !gone.has(l.to)),
  };
}

/** Where a string attaches to an item: the pin at top centre. */
export function pinPoint(i: Item): { x: number; y: number } {
  // A map pin joins up at the middle of its head.
  if (i.kind === "pin") return { x: i.x + i.w / 2, y: i.y + 20 };
  if (i.pin) return { x: i.x + i.pin.x * i.w, y: i.y + i.pin.y * i.h };
  return { x: i.x + i.w / 2, y: i.y + 14 };
}

/** Whiteboard view: each paper colour is drawn as a dry-erase marker colour instead. */
const MARKER_COLORS: Record<string, string> = {
  "#fff4a3": "#1f2937", // yellow paper -> black marker
  "#ffd0dc": "#dc2626", // pink -> red
  "#c9eab8": "#15803d", // green -> green
  "#c6e2ff": "#2563eb", // blue -> blue
  "#e6d4ff": "#7c3aed", // purple -> purple
  "#ffffff": "#475569", // white -> grey
};

export function markerColor(paper: string): string {
  return MARKER_COLORS[paper.toLowerCase()] ?? "#1f2937";
}
