"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PAPER_COLORS,
  autoFitSections,
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
import { WHITEBOARD_TILE_SIZE, createWhiteboardTexture } from "@/lib/whiteboard";
import { fileToDataUrl } from "@/lib/image";
import type { BoardStyle } from "@/lib/boardStyle";
import { PIN_COLORS } from "@/lib/model";
import type { Board as BoardData, Item, ItemKind, ItemType, Link, View } from "@/lib/types";
import ItemCard from "./ItemCard";
import PhotoViewer from "./PhotoViewer";
import ItemPopover, { POPOVER_WIDTH, type PopoverPlacement } from "./ItemPopover";
import ResizeHandles, { type Grip } from "./ResizeHandles";
import Breadcrumb from "./Breadcrumb";
import GestureHint from "./GestureHint";
import SearchPanel from "./SearchPanel";
import Strings from "./Strings";

type Pt = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
const MIN_W = 90;
const MIN_H = 60;
/** At or above this zoom, cards are drawn square so their text is sharp. */
const STRAIGHT_SCALE = 0.3;
type Gesture =
  | { type: "resize"; id: string; corner: Grip; sx: number; sy: number; orig: Rect }
  | { type: "pan"; sx: number; sy: number; view: View; moved: boolean; held?: boolean }
  | { type: "pinch"; dist: number; view: View; wx: number; wy: number }
  | { type: "tack"; id: string; sx: number; sy: number; moved: boolean }
  | { type: "drag"; id: string; lx: number; ly: number; sx: number; sy: number; moved: boolean; held?: boolean; grip?: boolean };

interface Props {
  board: BoardData;
  update: (id: string, fn: (b: BoardData) => BoardData) => void;
  boardStyle: BoardStyle;
}

export default function Board({ board, update, boardStyle }: Props) {
  const wb = boardStyle === "whiteboard";
  const boardId = board.id;
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pointers = useRef(new Map<number, Pt>());
  const gesture = useRef<Gesture | null>(null);
  const lastBgTap = useRef(0);
  const lastTap = useRef<{ id: string; t: number } | null>(null);
  const lastZoom = useRef(0);
  const pressTimer = useRef<number | undefined>(undefined);
  const goUpRef = useRef<() => void>(() => {});
  const escRef = useRef<() => void>(() => {});
  const animTimer = useRef<number | undefined>(undefined);
  const holdTimer = useRef<number | undefined>(undefined);
  const cursorTimer = useRef<number | undefined>(undefined);
  const holding = useRef(false);

  const [view, setView] = useState<View>(() =>
    board.view.scale > 0
      ? board.view
      : fitView(boundsOf(board.items), { w: window.innerWidth, h: window.innerHeight }),
  );
  const [cork] = useState(() => createCorkTexture());
  const [boardTex] = useState(() => createWhiteboardTexture());
  const [animate, setAnimate] = useState(false);
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const [selectedId, setSelectedIdState] = useState<string | null>(null);
  // The settings card is separate from selection: selecting shows the resize grips, and the Settings button opens the card.
  // cardId stays set while the card slides back, so it can finish its animation before it unmounts.
  const [cardId, setCardId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Mouse cursor: the normal pointer unless the button is held (move / grabbing) or a double-click just zoomed (briefly zoom-in / zoom-out).
  const [cursor, setCursor] = useState<"move" | "grabbing" | "zoom-in" | "zoom-out" | undefined>(undefined);
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [panel, setPanel] = useState<"search" | "types" | null>(null);
  // The photo stack being looked through (item + which photo).
  const [viewer, setViewer] = useState<{ id: string; index: number } | null>(null);

  const edit = (fn: (b: BoardData) => BoardData) => update(boardId, fn);

  function setSelectedId(id: string | null) {
    if (id !== selectedId) setSettingsOpen(false);
    setSelectedIdState(id);
  }

  function openSettings(id: string) {
    setCardId(id);
    setSettingsOpen(true);
  }

  const depths = useMemo(() => computeDepths(board.items), [board.items]);
  const itemsById = useMemo(() => new Map(board.items.map((i) => [i.id, i])), [board.items]);
  const typesById = useMemo(() => new Map(board.types.map((t) => [t.id, t])), [board.types]);
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
  // What the camera is "in": the deepest visible item (not a pin) under the middle of the screen that fills at least
  // half of the view. Drives the breadcrumb, the Up button and where new items are added.
  const current = useMemo(() => {
    const cx = (size.w / 2 - view.x) / view.scale;
    const cy = (size.h / 2 - view.y) / view.scale;
    let best: Item | null = null;
    let bestDepth = -1;
    for (const i of board.items) {
      if (i.kind === "pin" || !visible.has(i.id)) continue;
      if (cx < i.x || cx > i.x + i.w || cy < i.y || cy > i.y + i.h) continue;
      if (i.w * view.scale < size.w * 0.5 && i.h * view.scale < size.h * 0.5) continue;
      const d = depths.get(i.id) ?? 0;
      if (d > bestDepth) {
        best = i;
        bestDepth = d;
      }
    }
    return best;
  }, [board.items, depths, visible, size, view]);
  const crumbs = useMemo(() => {
    const out: Item[] = [];
    const seen = new Set<string>();
    let cur: Item | null | undefined = current;
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      out.unshift(cur);
      cur = cur.parentId ? itemsById.get(cur.parentId) : null;
    }
    return out;
  }, [current, itemsById]);
  const selected = selectedId ? itemsById.get(selectedId) ?? null : null;
  const popItem = cardId ? itemsById.get(cardId) ?? null : null;
  const leaving = !(settingsOpen && !!selected && selected.id === cardId);
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

  // Sections set to auto-fit follow what is inside them (including while their contents are being changed).
  useEffect(() => {
    if (autoFitSections(board) !== board) update(boardId, autoFitSections);
  }, [board, boardId, update]);

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
      if ((e.target as HTMLElement).closest("[data-modal]")) return;
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

  /** Show a zoom cursor for half a second, then back to the pointer. */
  function flashCursor(c: "zoom-in" | "zoom-out") {
    window.clearTimeout(cursorTimer.current);
    setCursor(c);
    cursorTimer.current = window.setTimeout(() => setCursor(undefined), 500);
  }

  function animateTo(next: View) {
    lastZoom.current = performance.now();
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
    // Right and middle mouse buttons never start a gesture; right-click opens the editor (see onContextMenu).
    if (e.pointerType === "mouse" && e.button !== 0) return;
    window.clearTimeout(animTimer.current);
    window.clearTimeout(pressTimer.current);
    window.clearTimeout(cursorTimer.current);
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

    const tack = (e.target as HTMLElement).closest<HTMLElement>("[data-tack]");
    if (tack?.dataset.tack && itemsById.has(tack.dataset.tack)) {
      gesture.current = { type: "tack", id: tack.dataset.tack, sx: e.clientX, sy: e.clientY, moved: false };
      return;
    }

    // The big Move handle drags its item (and what is inside it) from anywhere on the handle.
    const mover = (e.target as HTMLElement).closest<HTMLElement>("[data-move]");
    if (mover?.dataset.move && itemsById.has(mover.dataset.move)) {
      gesture.current = { type: "drag", id: mover.dataset.move, lx: e.clientX, ly: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, grip: true };
      return;
    }

    const grip = (e.target as HTMLElement).closest<HTMLElement>("[data-resize]");
    const gripItem = grip?.dataset.resizeId ? itemsById.get(grip.dataset.resizeId) : undefined;
    if (grip && gripItem) {
      gesture.current = {
        type: "resize",
        id: gripItem.id,
        corner: grip.dataset.resize as Grip,
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

    // Holding the mouse button down (not a quick click) swaps the pointer for the move cursor.
    if (e.pointerType === "mouse") {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = window.setTimeout(() => {
        const g = gesture.current;
        if (!g || (g.type !== "pan" && g.type !== "drag")) return;
        holding.current = true;
        setCursor(g.type === "pan" ? "grabbing" : "move");
      }, 180);
    }

    // Touch has no right button: press and hold selects instead.
    if (e.pointerType !== "mouse") {
      const at = local(e);
      pressTimer.current = window.setTimeout(() => {
        const g = gesture.current;
        if (!g || pointers.current.size !== 1 || (g.type !== "pan" && g.type !== "drag") || g.moved) return;
        g.held = true;
        openEditorAt((at.x - view.x) / view.scale, (at.y - view.y) / view.scale);
      }, 550);
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
      edit((b) => ({ ...b, updatedAt: Date.now(), items: b.items.map((i) => (i.id === g.id ? { ...i, x, y, w, h, ...(i.autoFit ? { autoFit: undefined } : {}) } : i)) }));
    } else if (g.type === "tack") {
      if (!g.moved && Math.hypot(e.clientX - g.sx, e.clientY - g.sy) > 4) g.moved = true;
      const it = itemsById.get(g.id);
      if (g.moved && it) {
        const r = containerRef.current!.getBoundingClientRect();
        const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
        const pin = {
          x: clamp01(((e.clientX - r.left - view.x) / view.scale - it.x) / it.w),
          y: clamp01(((e.clientY - r.top - view.y) / view.scale - it.y) / it.h),
        };
        edit((b) => ({ ...b, updatedAt: Date.now(), items: b.items.map((i) => (i.id === g.id ? { ...i, pin } : i)) }));
      }
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
    window.clearTimeout(pressTimer.current);
    window.clearTimeout(holdTimer.current);
    if (holding.current) {
      holding.current = false;
      setCursor(undefined);
    }
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

    if (g.type === "tack") {
      if (!g.moved) handleTap(g.id, e.timeStamp);
      return;
    }
    if (g.type === "pan" && g.held) return;
    if (g.type === "pan" && !g.moved) {
      // Tapped something that doesn't grab (e.g. the body of an open section): find it by position.
      const p = local(e);
      const hit = worldHit((p.x - view.x) / view.scale, (p.y - view.y) / view.scale);
      if (hit) {
        handleTap(hit.id, e.timeStamp);
      } else {
        setSelectedId(null);
        setLinkFrom(null);
        // Double-click on the bare board: out one level.
        if (e.timeStamp - lastBgTap.current < 350) {
          lastBgTap.current = 0;
          if (current) flashCursor("zoom-out");
          goUp();
        } else {
          lastBgTap.current = e.timeStamp;
        }
      }
    } else if (g.type === "drag") {
      if (g.moved) {
        edit((b) => reparent(b, g.id));
      } else if (!g.held && !g.grip) {
        handleTap(g.id, e.timeStamp);
      }
    }
  }

  /** Right-click or press-and-hold: open the edit card for the item under the pointer. */
  function openEditorAt(wx: number, wy: number) {
    const hit = worldHit(wx, wy);
    setLinkFrom(null);
    setSelectedId(hit ? hit.id : null);
  }

  function onContextMenu(e: React.MouseEvent) {
    // Leave the browser menu alone over buttons, fields and the edit card.
    if ((e.target as HTMLElement).closest("button, input, select, textarea, a, label, [data-popover]")) return;
    e.preventDefault();
    const r = containerRef.current!.getBoundingClientRect();
    openEditorAt((e.clientX - r.left - view.x) / view.scale, (e.clientY - r.top - view.y) / view.scale);
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

  /** A note needs a different height for its text. Normally it only grows; an auto-fit note (exact) also shrinks. */
  function fitNote(id: string, h: number, exact?: boolean) {
    edit((b) => ({
      ...b,
      items: b.items.map((i) => (i.id === id && (exact ? Math.abs(i.h - h) > 0.5 : i.h < h) ? { ...i, h } : i)),
    }));
  }

  /** The camera that frames an item, zoomed in far enough that the item is actually shown at its level. */
  function viewFor(item: Item): View {
    const { w, h } = viewportSize();
    // How much of the screen the item should fill: big things (top-level sections, maps) fill nearly all of it, small notes only
    // about 35-40% so they don't balloon. Grows smoothly with the item's size in between.
    const size = Math.max(item.w, item.h);
    const fill = Math.min(0.92, Math.max(0.35, 0.35 + (0.57 * (size - 200)) / 700));
    const need = thresholdFor(depths.get(item.id) ?? 0) + 0.05;
    const scale = Math.max(need, clampScale(Math.min((w * fill) / item.w, (h * fill) / item.h)));
    return { scale, x: w / 2 - (item.x + item.w / 2) * scale, y: h / 2 - (item.y + item.h / 2) * scale };
  }

  function zoomToItem(item: Item) {
    animateTo(viewFor(item));
  }

  /** Select an item and bring it on screen. */
  function focusItem(item: Item) {
    setSelectedId(item.id);
    setLinkFrom(null);
    zoomToItem(item);
  }

  /** Out one level: from a note to the section it is in, from a section to the one around it, from a top-level section to everything. */
  function goUp() {
    if (!current) return;
    const parent = current.parentId ? itemsById.get(current.parentId) : undefined;
    if (parent) zoomToItem(parent);
    else fitRect(boundsOf(board.items));
  }

  useEffect(() => {
    goUpRef.current = goUp;
    escRef.current = () => {
      if (viewer) {
        setViewer(null);
        return;
      }
      if (settingsOpen) {
        setSettingsOpen(false);
        return;
      }
      if (selectedId || linkFrom) {
        setSelectedId(null);
        setLinkFrom(null);
      } else goUp();
    };
  });

  // Escape: close the edit card, else go up a level.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      escRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
    // A double-click must not zoom twice: ignore the second click while the first zoom is still settling.
    if (now - lastZoom.current < 450) return;
    const item = itemsById.get(id);
    if (!item) return;
    setSelectedId(null);
    // Zooming in takes a double-click (or double-tap) on the same item; a single click does nothing.
    if (lastTap.current?.id !== id || now - lastTap.current.t > 400) {
      lastTap.current = { id, t: now };
      return;
    }
    lastTap.current = null;
    // A pin zooms to the section it points at.
    const targetId = item.kind === "pin" ? board.links.find((l) => l.from === item.id)?.to : undefined;
    const target = (targetId ? itemsById.get(targetId) : undefined) ?? item;
    if (target.id === current?.id) return;
    flashCursor("zoom-in");
    zoomToItem(target);
  }

  // ---- adding things ----
  function addItem(kind: ItemKind, opts: { imageData?: string; ratio?: number; parent?: Item | null; type?: ItemType } = {}) {
    const sel = selected;
    const parent =
      opts.parent !== undefined
        ? opts.parent
        : sel
          ? sel.kind === "section" ? sel : itemsById.get(sel.parentId ?? "") ?? null
          : current ? (current.kind === "section" ? current : itemsById.get(current.parentId ?? "") ?? null) : null;
    const depth = parent ? (depths.get(parent.id) ?? 0) + 1 : 0;
    const size = defaultSize(kind, depth);
    if (kind === "image" && opts.ratio) size.h = Math.round(size.w * opts.ratio) + 34;

    let x: number;
    let y: number;
    if (parent && kind === "pin") {
      // A pin goes near the middle of the map it is dropped on, fanned out so several don't stack.
      const n = board.items.filter((i) => i.parentId === parent.id && i.kind === "pin").length;
      x = parent.x + parent.w / 2 - size.w / 2 + ((n % 4) - 1.5) * 50;
      y = parent.y + parent.h / 2 - size.h / 2 + ((Math.floor(n / 4) % 3) - 1) * 60;
    } else if (parent) {
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
      title: opts.type ? opts.type.name : kind === "section" ? "New section" : kind === "image" ? "Photo" : kind === "pin" ? "New pin" : "New note",
      text: "",
      color: opts.type ? opts.type.color : kind === "pin" ? PIN_COLORS[0] : kind === "section" ? PAPER_COLORS[3] : PAPER_COLORS[0],
      imageData: opts.imageData,
      ...(opts.type ? { typeId: opts.type.id } : {}),
      ...(kind === "pin" ? { icon: "📍" } : {}),
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

  async function onPickMap(item: Item, file: File) {
    try {
      // Maps need more detail than photos, and the section takes the picture's shape so nothing is cropped.
      const { dataUrl, ratio } = await fileToDataUrl(file, 2400);
      edit((b) => ({
        ...b,
        updatedAt: Date.now(),
        items: b.items.map((i) => (i.id === item.id ? { ...i, mapData: dataUrl, h: Math.max(MIN_H, Math.round(i.w * ratio)) } : i)),
      }));
    } catch {
      alert("Could not read that image.");
    }
  }

  /** Downscale and attach picked photos to a note or section. A file that can't be read is skipped and reported. */
  async function onAddPhotos(item: Item, files: File[]) {
    const urls: string[] = [];
    let failed = 0;
    for (const file of files) {
      try {
        urls.push((await fileToDataUrl(file, 1400)).dataUrl);
      } catch {
        failed++;
      }
    }
    if (urls.length) {
      edit((b) => ({ ...b, updatedAt: Date.now(), items: b.items.map((i) => (i.id === item.id ? { ...i, photos: [...(i.photos ?? []), ...urls] } : i)) }));
    }
    if (failed) alert(`Could not read ${failed} of those images.`);
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

  const wbScale = 0.5 + Math.min(Math.max(view.scale, 0.2), 2) * 0.5;
  const corkScale = 0.45 + Math.min(Math.max(view.scale, 0.2), 2) * 0.5;
  const depthShown =[...visible].reduce((m, id) => Math.max(m, depths.get(id) ?? 0), 0);
  const tool =
    "rounded-full bg-white/95 px-3.5 py-2 text-sm font-semibold text-stone-800 shadow-md active:bg-stone-200 dark:bg-zinc-600/95 dark:text-zinc-50 dark:active:bg-zinc-500";

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none select-none overflow-clip"
      style={
        wb
          ? {
              // A glossy white surface with a soft sheen; it stays put while the marker work moves over it.
              backgroundColor: "#f1f4f5",
              // Smears and ghost lines tile and follow the camera; the sheen is fixed to the screen.
              backgroundImage: [
                "radial-gradient(ellipse at 22% 18%, rgba(255,255,255,0.7), rgba(255,255,255,0) 55%)",
                "radial-gradient(ellipse at 80% 85%, rgba(190,205,215,0.3), rgba(190,205,215,0) 60%)",
                boardTex ? `url(${boardTex})` : "",
              ]
                .filter(Boolean)
                .join(", "),
              backgroundSize: `auto, auto, ${WHITEBOARD_TILE_SIZE * wbScale}px ${WHITEBOARD_TILE_SIZE * wbScale}px`,
              backgroundPosition: `0 0, 0 0, ${view.x}px ${view.y}px`,
            }
          : {
              backgroundColor: "#d2ac7e",
              backgroundImage: cork ? `url(${cork})` : undefined,
              // The cork grain follows the camera but zooms gently, so it never turns to mush.
              backgroundSize: `${CORK_TILE_SIZE * corkScale}px ${CORK_TILE_SIZE * corkScale}px`,
              backgroundPosition: `${view.x}px ${view.y}px`,
            }
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={onContextMenu}
      data-cursor={cursor}
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
              boardStyle={boardStyle}
              type={item.typeId ? typesById.get(item.typeId) : undefined}
              onFit={fitNote}
              onOpenPhotos={(id) => setViewer({ id, index: 0 })}
              straight={view.scale >= STRAIGHT_SCALE}
            />
          );
        })}
        <Strings links={board.links} items={itemsById} visible={visible} whiteboard={wb} />
        {selected && visible.has(selected.id) && (
          <ResizeHandles item={selected} scale={view.scale} onSettings={() => openSettings(selected.id)} />
        )}
      </div>

      {/* floating controls */}
      <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-2" onPointerDown={(e) => e.stopPropagation()}>
        <button className={tool} onClick={() => addItem("section")}>+ Section</button>
        <button className={tool} onClick={() => addItem("note")}>+ Note</button>
        <button className={tool} onClick={() => fileRef.current?.click()}>+ Photo</button>
        <button className={tool} onClick={() => addItem("pin")}>+ Pin</button>
        <button className={tool} onClick={() => setPanel(panel === "types" ? null : "types")} aria-expanded={panel === "types"}>+ Type ▾</button>
        <button className={tool} onClick={() => setPanel(panel === "search" ? null : "search")} aria-expanded={panel === "search"}>🔍 Search</button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
      </div>
      <Breadcrumb crumbs={crumbs} onAll={() => fitRect(boundsOf(board.items))} onPick={(item) => zoomToItem(item)} />
      <GestureHint />
      <div
        className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-2"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="rounded-full bg-black/55 px-3 py-1 text-xs text-white">
          {Math.round(view.scale * 100)}% · level {depthShown + 1}
        </div>
        <button className={`${tool} disabled:opacity-40`} onClick={goUp} disabled={!current} aria-label="Up one level" title="Up one level (Esc, or double-click the board)">↑ Up</button>
        <button className={tool} onClick={() => zoomBy(1.5)} aria-label="Zoom in">+</button>
        <button className={tool} onClick={() => zoomBy(1 / 1.5)} aria-label="Zoom out">−</button>
        <button className={tool} onClick={() => fitRect(boundsOf(board.items))}>Fit all</button>
      </div>

      {panel === "search" && (
        <SearchPanel
          board={board}
          onClose={() => setPanel(null)}
          onPick={(item) => {
            setPanel(null);
            focusItem(item);
          }}
        />
      )}
      {panel === "types" && (
        <div
          className="absolute inset-x-3 top-14 z-30 flex max-h-96 flex-col gap-1 overflow-y-auto rounded-lg bg-stone-50 p-2 text-stone-900 shadow-xl sm:right-auto sm:w-64 dark:bg-zinc-700 dark:text-zinc-50"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="px-2 pt-1 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-zinc-300">Add from a type</div>
          {board.types.length === 0 && <div className="px-2 py-2 text-sm">No types yet. Use Types in the top bar to design some.</div>}
          {board.types.map((t) => (
            <button
              key={t.id}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-stone-200 active:bg-stone-300 dark:hover:bg-zinc-600"
              onClick={() => {
                setPanel(null);
                addItem(t.kind, { type: t });
              }}
            >
              <span className="h-4 w-4 shrink-0 rounded-sm border border-black/25" style={{ background: t.color }} />
              <span className="min-w-0 flex-1 truncate font-semibold">{t.name}</span>
              <span className="text-xs text-stone-500 dark:text-zinc-300">{t.kind}</span>
            </button>
          ))}
        </div>
      )}

      {linkFrom && (
        <div className="absolute inset-x-0 top-14 z-20 mx-auto w-fit rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md">
          Tap the item to tie the string to
        </div>
      )}

      {showPopover && popItem && (
        <div data-popover onPointerDown={(e) => e.stopPropagation()}>
          <ItemPopover
            key={popItem.id}
            item={popItem}
            leaving={leaving}
            placement={popoverPlacement(popItem)}
            maxHeight={Math.max(160, size.h - popoverPlacement(popItem).top - 8)}
            links={board.links}
            itemsById={itemsById}
            linking={linkFrom === popItem.id}
            boardStyle={boardStyle}
            types={board.types}
            pinTargets={board.items.filter((i) => i.id !== popItem.id && i.kind !== "pin")}
            onPatchLink={(id, patch) => edit((b) => ({ ...b, updatedAt: Date.now(), links: b.links.map((l) => (l.id === id ? { ...l, ...patch } : l)) }))}
            onSetPinTarget={(targetId) =>
              edit((b) => {
                const prev = b.links.find((l) => l.from === popItem.id);
                const rest = prev ? b.links.filter((l) => l.id !== prev.id) : b.links;
                const link: Link | null = targetId ? { id: uid(), from: popItem.id, to: targetId, style: "line", color: popItem.color } : null;
                return { ...b, updatedAt: Date.now(), links: link ? [...rest, link] : rest };
              })
            }
            onPickMap={(file) => void onPickMap(popItem, file)}
            onAddPhotos={(files) => void onAddPhotos(popItem, files)}
            onViewPhotos={() => setViewer({ id: popItem.id, index: 0 })}
            onPatch={(patch) =>
              edit((b) => ({ ...b, updatedAt: Date.now(), items: b.items.map((i) => (i.id === popItem.id ? { ...i, ...patch } : i)) }))
            }
            onDelete={() => {
              const n = board.items.length;
              const after = removeItem(board, popItem.id).items.length;
              if (n - after > 1 && !confirm(`Delete this and ${n - after - 1} item(s) inside it?`)) return;
              edit((b) => removeItem(b, popItem.id));
              setSelectedId(null);
              setCardId(null);
            }}
            onZoomTo={() => zoomToItem(popItem)}
            onToggleLink={() => setLinkFrom(linkFrom === popItem.id ? null : popItem.id)}
            onRemoveLink={(id) => edit((b) => ({ ...b, updatedAt: Date.now(), links: b.links.filter((l) => l.id !== id) }))}
            onAddInside={(kind) => addItem(kind, { parent: popItem })}
            onClose={() => {
              setSettingsOpen(false);
              setLinkFrom(null);
            }}
            onLeft={() => setCardId(null)}
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
                boardStyle={boardStyle}
                type={item.typeId ? typesById.get(item.typeId) : undefined}
                cover={leaving ? "solid" : "enter"}
                straight={view.scale >= STRAIGHT_SCALE}
              />
            );
          })}
          {/* Strings tied to the item (or anything in it) go on top here too, so the copy never covers them. */}
          <Strings
            links={board.links.filter((l) => coverItems.some((i) => i.id === l.from || i.id === l.to))}
            items={itemsById}
            visible={visible}
            whiteboard={wb}
          />
          {!leaving && popItem && popItem.kind !== "pin" && <ResizeHandles item={popItem} scale={view.scale} />}
        </div>
      )}

      {viewer && (itemsById.get(viewer.id)?.photos?.length ?? 0) > 0 && (
        <PhotoViewer
          title={itemsById.get(viewer.id)?.title ?? ""}
          photos={itemsById.get(viewer.id)?.photos ?? []}
          index={viewer.index}
          onIndex={(index) => setViewer({ id: viewer.id, index })}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}
