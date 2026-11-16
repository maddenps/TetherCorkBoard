"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PAPER_COLORS,
  boundsOf,
  clampScale,
  computeDepths,
  descendantIds,
  defaultSize,
  fitView,
  moveItems,
  removeItem,
  reparent,
  thresholdFor,
  uid,
} from "@/lib/board";
import { CORK_TILE_SIZE, createCorkTexture } from "@/lib/cork";
import { fileToDataUrl } from "@/lib/image";
import type { Board as BoardData, Item, ItemKind, View } from "@/lib/types";
import ItemCard from "./ItemCard";
import ItemPopover, { POPOVER_WIDTH, type PopoverPlacement } from "./ItemPopover";
import ResizeHandles, { type Corner } from "./ResizeHandles";
import Strings from "./Strings";

type Pt = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
const MIN_W = 90;
const MIN_H = 60;
type Gesture =
  | { type: "resize"; id: string; corner: Corner; sx: number; sy: number; orig: Rect }
  | { type: "pan"; sx: number; sy: number; view: View; moved: boolean }
  | { type: "pinch"; dist: number; view: View; wx: number; wy: number }
  | { type: "drag"; id: string; lx: number; ly: number; sx: number; sy: number; moved: boolean };

interface Props {
  board: BoardData;
  update: (id: string, fn: (b: BoardData) => BoardData) => void;
}

export default function Board({ board, update }: Props) {
  const boardId = board.id;
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pointers = useRef(new Map<number, Pt>());
  const gesture = useRef<Gesture | null>(null);
  const lastTap = useRef<{ id: string; t: number } | null>(null);
  const animTimer = useRef<number | undefined>(undefined);

  const [view, setView] = useState<View>(() =>
    board.view.scale > 0
      ? board.view
      : fitView(boundsOf(board.items), { w: window.innerWidth, h: window.innerHeight }),
  );
  const [cork] = useState(() => createCorkTexture());
  const [animate, setAnimate] = useState(false);
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const [selectedId, setSelectedIdState] = useState<string | null>(null);
  // Kept after deselecting so the edit card can play its slide-back animation before it unmounts.
  const [lastId, setLastId] = useState<string | null>(null);
  const [linkFrom, setLinkFrom] = useState<string | null>(null);

  const edit = (fn: (b: BoardData) => BoardData) => update(boardId, fn);

  function setSelectedId(id: string | null) {
    setSelectedIdState(id);
    if (id) setLastId(id);
  }

  const depths = useMemo(() => computeDepths(board.items), [board.items]);
  const itemsById = useMemo(() => new Map(board.items.map((i) => [i.id, i])), [board.items]);
  const visible = useMemo(() => {
    const s = new Set<string>();
    for (const i of board.items) if (view.scale >= thresholdFor(depths.get(i.id) ?? 0)) s.add(i.id);
    return s;
  }, [board.items, depths, view.scale]);
  const childCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of board.items) if (i.parentId) m.set(i.parentId, (m.get(i.parentId) ?? 0) + 1);
    return m;
  }, [board.items]);
  const sorted = useMemo(
    () => [...board.items].sort((a, b) => (depths.get(a.id) ?? 0) - (depths.get(b.id) ?? 0)),
    [board.items, depths],
  );
  const selected = selectedId ? itemsById.get(selectedId) ?? null : null;
  const popItem = selected ?? (lastId ? itemsById.get(lastId) ?? null : null);
  const leaving = !selected;
  const showPopover = !!popItem && !animate && visible.has(popItem.id);
  const coverItems = useMemo(() => {
    if (!popItem) return [];
    const ids = descendantIds(board.items, popItem.id);
    ids.add(popItem.id);
    return sorted.filter((i) => ids.has(i.id));
  }, [board.items, popItem, sorted]);

  // Persist the camera (debounced) so reopening lands where you left off.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (view.scale === board.view.scale && view.x === board.view.x && view.y === board.view.y) return;
      update(boardId, (b) => ({ ...b, view, updatedAt: Date.now() }));
    }, 700);
    return () => window.clearTimeout(t);
  }, [view, board.view, boardId, update]);

  // Track the board size in state so the popover can be placed during render.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Wheel / trackpad zoom around the cursor (needs a non-passive listener).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      setView((v) => {
        const scale = clampScale(v.scale * Math.exp(-e.deltaY * 0.0015));
        const k = scale / v.scale;
        return { scale, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function animateTo(next: View) {
    window.clearTimeout(animTimer.current);
    setAnimate(true);
    setView(next);
    animTimer.current = window.setTimeout(() => setAnimate(false), 450);
  }

  function viewportSize() {
    const r = containerRef.current!.getBoundingClientRect();
    return { w: r.width, h: r.height };
  }

  function fitRect(rect: { x: number; y: number; w: number; h: number }) {
    animateTo(fitView(rect, viewportSize()));
  }

  function zoomBy(factor: number) {
    const { w, h } = viewportSize();
    const scale = clampScale(view.scale * factor);
    const k = scale / view.scale;
    animateTo({ scale, x: w / 2 - (w / 2 - view.x) * k, y: h / 2 - (h / 2 - view.y) * k });
  }

  // ---- pointer gestures: pan, pinch, drag item, tap, double-tap ----
  function local(e: React.PointerEvent): Pt {
    const r = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onPointerDown(e: React.PointerEvent) {
    window.clearTimeout(animTimer.current);
    setAnimate(false);
    try {
      containerRef.current!.setPointerCapture(e.pointerId);
    } catch {
      // Capture is only a nicety (keeps drags alive outside the board); gestures still work without it.
    }
    pointers.current.set(e.pointerId, local(e));

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      gesture.current = {
        type: "pinch",
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        view,
        wx: (cx - view.x) / view.scale,
        wy: (cy - view.y) / view.scale,
      };
      return;
    }

    const grip = (e.target as HTMLElement).closest<HTMLElement>("[data-resize]");
    const gripItem = grip?.dataset.resizeId ? itemsById.get(grip.dataset.resizeId) : undefined;
    if (grip && gripItem) {
      gesture.current = {
        type: "resize",
        id: gripItem.id,
        corner: grip.dataset.resize as Corner,
        sx: e.clientX,
        sy: e.clientY,
        orig: { x: gripItem.x, y: gripItem.y, w: gripItem.w, h: gripItem.h },
      };
      return;
    }

    const hit = (e.target as HTMLElement).closest<HTMLElement>("[data-item-id]");
    if (hit?.dataset.itemId) {
      gesture.current = { type: "drag", id: hit.dataset.itemId, lx: e.clientX, ly: e.clientY, sx: e.clientX, sy: e.clientY, moved: false };
    } else {
      gesture.current = { type: "pan", sx: e.clientX, sy: e.clientY, view, moved: false };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, local(e));
    const g = gesture.current;
    if (!g) return;

    if (g.type === "pinch" && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const scale = clampScale(g.view.scale * (Math.hypot(a.x - b.x, a.y - b.y) / g.dist));
      setView({ scale, x: cx - g.wx * scale, y: cy - g.wy * scale });
    } else if (g.type === "pan") {
      const dx = e.clientX - g.sx;
      const dy = e.clientY - g.sy;
      if (Math.hypot(dx, dy) > 4) g.moved = true;
      setView({ ...g.view, x: g.view.x + dx, y: g.view.y + dy });
    } else if (g.type === "resize") {
      const dx = (e.clientX - g.sx) / view.scale;
      const dy = (e.clientY - g.sy) / view.scale;
      const o = g.orig;
      let { x, y, w, h } = o;
      if (g.corner.includes("e")) w = Math.max(MIN_W, o.w + dx);
      if (g.corner.includes("s")) h = Math.max(MIN_H, o.h + dy);
      if (g.corner.includes("w")) {
        w = Math.max(MIN_W, o.w - dx);
        x = o.x + o.w - w;
      }
      if (g.corner.includes("n")) {
        h = Math.max(MIN_H, o.h - dy);
        y = o.y + o.h - h;
      }
      edit((b) => ({ ...b, updatedAt: Date.now(), items: b.items.map((i) => (i.id === g.id ? { ...i, x, y, w, h } : i)) }));
    } else if (g.type === "drag") {
      if (!g.moved && Math.hypot(e.clientX - g.sx, e.clientY - g.sy) > 5) g.moved = true;
      if (g.moved) {
        const dx = (e.clientX - g.lx) / view.scale;
        const dy = (e.clientY - g.ly) / view.scale;
        g.lx = e.clientX;
        g.ly = e.clientY;
        edit((b) => moveItems(b, g.id, dx, dy));
      }
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (pointers.current.size === 1 && g?.type === "pinch") {
      // One finger left after a pinch: carry on panning from here.
      const [p] = [...pointers.current.values()];
      const r = containerRef.current!.getBoundingClientRect();
      gesture.current = { type: "pan", sx: p.x + r.left, sy: p.y + r.top, view, moved: true };
      return;
    }
    if (pointers.current.size > 0) return;
    gesture.current = null;
    if (!g) return;

    if (g.type === "pan" && !g.moved) {
      // Tapped something that doesn't grab (e.g. the body of an open section): find it by position.
      const p = local(e);
      const hit = worldHit((p.x - view.x) / view.scale, (p.y - view.y) / view.scale);
      if (hit) {
        handleTap(hit.id, e.timeStamp);
      } else {
        setSelectedId(null);
        setLinkFrom(null);
      }
    } else if (g.type === "drag") {
      if (g.moved) {
        edit((b) => reparent(b, g.id));
      } else {
        handleTap(g.id, e.timeStamp);
      }
    }
  }

  /** Deepest visible item under a world point (smaller wins ties), regardless of what the DOM lets through. */
  function worldHit(wx: number, wy: number): Item | null {
    let best: Item | null = null;
    let bestDepth = -1;
    for (const i of board.items) {
      if (!visible.has(i.id)) continue;
      if (wx < i.x || wx > i.x + i.w || wy < i.y || wy > i.y + i.h) continue;
      const d = depths.get(i.id) ?? 0;
      if (d > bestDepth || (d === bestDepth && best && i.w * i.h < best.w * best.h)) {
        best = i;
        bestDepth = d;
      }
    }
    return best;
  }

  function zoomToItem(item: Item) {
    fitRect(item.kind === "section" ? item : { x: item.x - 60, y: item.y - 60, w: item.w + 120, h: item.h + 120 });
  }

  function handleTap(id: string, now: number) {
    if (linkFrom && linkFrom !== id) {
      const from = linkFrom;
      edit((b) =>
        b.links.some((l) => (l.from === from && l.to === id) || (l.from === id && l.to === from))
          ? b
          : { ...b, updatedAt: Date.now(), links: [...b.links, { id: uid(), from, to: id }] },
      );
      setLinkFrom(null);
      setSelectedId(id);
      return;
    }
    const item = itemsById.get(id);
    if (item && lastTap.current?.id === id && now - lastTap.current.t < 350) {
      lastTap.current = null;
      setSelectedId(id);
      zoomToItem(item);
      return;
    }
    lastTap.current = { id, t: now };
    setSelectedId(id);
  }

  // ---- adding things ----
  function addItem(kind: ItemKind, opts: { imageData?: string; ratio?: number; parent?: Item | null } = {}) {
    const sel = selected;
    const parent =
      opts.parent !== undefined ? opts.parent : sel ? (sel.kind === "section" ? sel : itemsById.get(sel.parentId ?? "") ?? null) : null;
    const depth = parent ? (depths.get(parent.id) ?? 0) + 1 : 0;
    const size = defaultSize(kind, depth);
    if (kind === "image" && opts.ratio) size.h = Math.round(size.w * opts.ratio) + 34;

    let x: number;
    let y: number;
    if (parent) {
      const n = board.items.filter((i) => i.parentId === parent.id).length;
      const cols = Math.max(1, Math.floor((parent.w - 20) / (size.w + 16)));
      x = parent.x + 16 + (n % cols) * (size.w + 16);
      y = parent.y + 64 + Math.floor(n / cols) * (size.h + 16);
    } else {
      const { w, h } = viewportSize();
      const jitter = board.items.length % 5 * 24;
      x = (w / 2 - view.x) / view.scale - size.w / 2 + jitter;
      y = (h / 2 - view.y) / view.scale - size.h / 2 + jitter;
    }

    const item: Item = {
      id: uid(),
      parentId: parent?.id ?? null,
      kind,
      x,
      y,
      ...size,
      title: kind === "section" ? "New section" : kind === "image" ? "Photo" : "New note",
      text: "",
      color: kind === "section" ? PAPER_COLORS[3] : PAPER_COLORS[0],
      imageData: opts.imageData,
    };
    edit((b) => ({ ...b, updatedAt: Date.now(), items: [...b.items, item] }));
    setSelectedId(item.id);
    // Make sure the new thing is actually visible at this zoom.
    if (view.scale < thresholdFor(depth)) fitRect(parent ?? item);
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const { dataUrl, ratio } = await fileToDataUrl(file);
      addItem("image", { imageData: dataUrl, ratio });
    } catch {
      alert("Could not read that image.");
    }
  }

  /** Pop the edit card out beside the item (right, else left), clamped on screen; inside it if the item fills the view. */
  function popoverPlacement(item: Item): PopoverPlacement {
    const { w: cw, h: ch } = size;
    const left = item.x * view.scale + view.x;
    const right = (item.x + item.w) * view.scale + view.x;
    const top = item.y * view.scale + view.y;
    const gap = 14;
    const anchor = { w: item.w * view.scale, h: item.h * view.scale };
    const clampTop = (t: number) => Math.max(8, Math.min(t, ch - 340));
    if (right + gap + POPOVER_WIDTH <= cw - 8) return { left: right + gap, top: clampTop(top), side: "right", anchor };
    if (left - gap - POPOVER_WIDTH >= 8) return { left: left - gap - POPOVER_WIDTH, top: clampTop(top), side: "left", anchor };
    return { left: Math.max(8, cw - POPOVER_WIDTH - 12), top: clampTop(top + 40), side: "inside", anchor };
  }

  const corkScale = 0.45 + Math.min(Math.max(view.scale, 0.2), 2) * 0.5;
  const depthShown =[...visible].reduce((m, id) => Math.max(m, depths.get(id) ?? 0), 0);
  const tool =
    "rounded-full bg-white/95 px-3.5 py-2 text-sm font-semibold text-stone-800 shadow-md active:bg-stone-200 dark:bg-zinc-600/95 dark:text-zinc-50 dark:active:bg-zinc-500";

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none select-none overflow-hidden"
      style={{
        backgroundColor: "#d2ac7e",
        backgroundImage: cork ? `url(${cork})` : undefined,
        // The cork grain follows the camera but zooms gently, so it never turns to mush.
        backgroundSize: `${CORK_TILE_SIZE * corkScale}px ${CORK_TILE_SIZE * corkScale}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transition: animate ? "transform 400ms ease" : undefined,
        }}
      >
        {sorted.map((item) => {
          const depth = depths.get(item.id) ?? 0;
          return (
            <ItemCard
              key={item.id}
              item={item}
              depth={depth}
              visible={visible.has(item.id)}
              childrenVisible={view.scale >= thresholdFor(depth + 1)}
              childCount={childCounts.get(item.id) ?? 0}
              selected={item.id === selectedId}
              linkTarget={item.id === linkFrom}
            />
          );
        })}
        <Strings links={board.links} items={itemsById} visible={visible} />
        {selected && visible.has(selected.id) && <ResizeHandles item={selected} scale={view.scale} />}
      </div>

      {/* floating controls */}
      <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-2" onPointerDown={(e) => e.stopPropagation()}>
        <button className={tool} onClick={() => addItem("section")}>+ Section</button>
        <button className={tool} onClick={() => addItem("note")}>+ Note</button>
        <button className={tool} onClick={() => fileRef.current?.click()}>+ Photo</button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
      </div>
      <div
        className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-2"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="rounded-full bg-black/55 px-3 py-1 text-xs text-white">
          {Math.round(view.scale * 100)}% · level {depthShown + 1}
        </div>
        <button className={tool} onClick={() => zoomBy(1.5)} aria-label="Zoom in">+</button>
        <button className={tool} onClick={() => zoomBy(1 / 1.5)} aria-label="Zoom out">−</button>
        <button className={tool} onClick={() => fitRect(boundsOf(board.items))}>Fit all</button>
      </div>

      {linkFrom && (
        <div className="absolute inset-x-0 top-14 z-20 mx-auto w-fit rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md">
          Tap the item to tie the string to
        </div>
      )}

      {showPopover && popItem && (
        <div onPointerDown={(e) => e.stopPropagation()}>
          <ItemPopover
            key={popItem.id}
            item={popItem}
            leaving={leaving}
            placement={popoverPlacement(popItem)}
            maxHeight={Math.max(200, size.h - 16)}
            links={board.links}
            itemsById={itemsById}
            linking={linkFrom === popItem.id}
            onPatch={(patch) =>
              edit((b) => ({ ...b, updatedAt: Date.now(), items: b.items.map((i) => (i.id === popItem.id ? { ...i, ...patch } : i)) }))
            }
            onDelete={() => {
              const n = board.items.length;
              const after = removeItem(board, popItem.id).items.length;
              if (n - after > 1 && !confirm(`Delete this and ${n - after - 1} item(s) inside it?`)) return;
              edit((b) => removeItem(b, popItem.id));
              setSelectedId(null);
              setLastId(null);
            }}
            onZoomTo={() => zoomToItem(popItem)}
            onToggleLink={() => setLinkFrom(linkFrom === popItem.id ? null : popItem.id)}
            onRemoveLink={(id) => edit((b) => ({ ...b, updatedAt: Date.now(), links: b.links.filter((l) => l.id !== id) }))}
            onAddInside={(kind) => addItem(kind, { parent: popItem })}
            onClose={() => {
              setSelectedId(null);
              setLinkFrom(null);
            }}
            onLeft={() => setLastId(null)}
          />
        </div>
      )}

      {/* A copy of the item (and what is inside it) drawn above the edit card, so the card slides out from truly underneath. */}
      {showPopover && (
        <div
          className="no-pointer absolute left-0 top-0 z-40 origin-top-left"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
          aria-hidden
        >
          {coverItems.map((item) => {
            const depth = depths.get(item.id) ?? 0;
            return (
              <ItemCard
                key={item.id}
                item={item}
                depth={depth}
                visible={visible.has(item.id)}
                childrenVisible={view.scale >= thresholdFor(depth + 1)}
                childCount={childCounts.get(item.id) ?? 0}
                selected={!leaving && item.id === popItem?.id}
                linkTarget={false}
              />
            );
          })}
          {/* Strings tied to the item (or anything in it) go on top here too, so the copy never covers them. */}
          <Strings
            links={board.links.filter((l) => coverItems.some((i) => i.id === l.from || i.id === l.to))}
            items={itemsById}
            visible={visible}
          />
          {!leaving && popItem && <ResizeHandles item={popItem} scale={view.scale} />}
        </div>
      )}
    </div>
  );
}
