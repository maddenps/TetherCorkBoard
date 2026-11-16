import type { Board, Item, ItemKind, View } from "./types";

/**
 * Semantic zoom: an item at hierarchy depth d is only shown once the board
 * scale reaches THRESHOLDS[d]. Depth 0 (top-level areas) is always visible.
 */
export const THRESHOLDS = [0, 0.45, 0.9, 1.6, 2.6];
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
  return { w: 180, h: 100 };
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

export function clampScale(s: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
}

/** View that centres `rect` inside a viewport of the given size. */
export function fitView(
  rect: { x: number; y: number; w: number; h: number },
  viewport: { w: number; h: number },
  padding = 60,
): View {
  const scale = clampScale(
    Math.min((viewport.w - padding * 2) / rect.w, (viewport.h - padding * 2) / rect.h),
  );
  return {
    scale,
    x: viewport.w / 2 - (rect.x + rect.w / 2) * scale,
    y: viewport.h / 2 - (rect.y + rect.h / 2) * scale,
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
  return { x: i.x + i.w / 2, y: i.y + 14 };
}
