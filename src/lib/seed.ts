import { PAPER_COLORS, uid } from "./board";
import type { Board, Item, ItemKind, Link } from "./types";

/** Demo board showing the area > boulder > route hierarchy. */
export function createDemoBoard(): Board {
  const items: Item[] = [];
  const links: Link[] = [];

  const add = (
    parent: Item | null,
    kind: ItemKind,
    title: string,
    dx: number,
    dy: number,
    w: number,
    h: number,
    color: string,
    text = "",
  ): Item => {
    const item: Item = {
      id: uid(),
      parentId: parent?.id ?? null,
      kind,
      x: (parent?.x ?? 0) + dx,
      y: (parent?.y ?? 0) + dy,
      w,
      h,
      title,
      text,
      color,
    };
    items.push(item);
    return item;
  };
  const [yellow, pink, green, blue, purple] = PAPER_COLORS;

  const areaA = add(null, "section", "Pine Ridge", 0, 0, 900, 620, green);
  const mossy = add(areaA, "section", "Mossy Wall", 30, 90, 400, 300, blue);
  add(mossy, "note", "Warm-up slab V0", 20, 60, 180, 100, yellow, "Easy, good for warming up.");
  add(mossy, "note", "Crimp City V4", 210, 60, 170, 100, yellow, "Small crimps, stay left.");
  add(mossy, "note", "Mossy Mantle V2", 20, 180, 180, 100, yellow, "Brush the top first.");
  const hulk = add(areaA, "section", "The Hulk", 470, 90, 400, 300, blue);
  add(hulk, "note", "Big Roof V6", 20, 60, 180, 100, pink, "Project for day 2.");
  add(hulk, "note", "Sit Start V5", 210, 60, 170, 100, yellow);

  const areaB = add(null, "section", "The Boneyard", 1150, 180, 900, 620, purple);
  const quarry = add(areaB, "section", "Quarry Block", 30, 90, 400, 300, blue);
  add(quarry, "note", "Corner V3", 20, 60, 180, 100, yellow);
  add(quarry, "note", "Slab Traverse V1", 210, 60, 170, 100, yellow);
  const twins = add(areaB, "section", "Twin Cracks", 470, 90, 400, 300, blue);
  add(twins, "note", "Left Crack V2", 20, 60, 180, 100, yellow);

  add(null, "note", "Pack list", 450, -260, 260, 170, yellow, "Pads, brushes, tape, chalk, headlamp, offline maps.");

  links.push({ id: uid(), from: areaA.id, to: areaB.id });
  links.push({ id: uid(), from: mossy.id, to: hulk.id });

  return {
    id: uid(),
    name: "Bouldering trip (demo)",
    items,
    links,
    view: { x: 0, y: 0, scale: 0 },
    updatedAt: Date.now(),
  };
}

export function createEmptyBoard(name: string): Board {
  return { id: uid(), name, items: [], links: [], view: { x: 0, y: 0, scale: 0 }, updatedAt: Date.now() };
}
