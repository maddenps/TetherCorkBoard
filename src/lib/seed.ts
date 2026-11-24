import { PAPER_COLORS, uid } from "./board";
import { defaultTypes } from "./model";
import type { Board, Item, ItemKind, Link } from "./types";

/** Demo board showing the nesting: places hold groups, groups hold notes. Zoom in to reveal each level. */
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

  const lake = add(null, "section", "Lakeside", 0, 0, 900, 620, green);
  const trail = add(lake, "section", "Morning hike", 30, 90, 400, 300, blue);
  add(trail, "note", "Trailhead parking", 20, 60, 180, 100, yellow, "Lot fills up by 9am.");
  add(trail, "note", "Viewpoint", 210, 60, 170, 100, yellow, "Bring a jacket.");
  add(trail, "note", "Snacks", 20, 180, 180, 100, yellow, "Fruit, nuts, water.");
  const picnic = add(lake, "section", "Picnic spot", 470, 90, 400, 300, blue);
  add(picnic, "note", "Blanket and cooler", 20, 60, 180, 100, pink, "Don't forget the ice.");
  add(picnic, "note", "Games", 210, 60, 170, 100, yellow);

  const town = add(null, "section", "Old Town", 1150, 180, 900, 620, purple);
  const food = add(town, "section", "Dinner", 30, 90, 400, 300, blue);
  add(food, "note", "Book a table", 20, 60, 180, 100, yellow);
  add(food, "note", "Check the menu", 210, 60, 170, 100, yellow);
  const sights = add(town, "section", "Sights", 470, 90, 400, 300, blue);
  add(sights, "note", "Old market", 20, 60, 180, 100, yellow);

  add(null, "note", "Packing list", 450, -260, 260, 170, yellow, "Sunscreen, charger, offline maps, snacks.");

  links.push({ id: uid(), from: lake.id, to: town.id });
  links.push({ id: uid(), from: trail.id, to: picnic.id });

  return {
    id: uid(),
    name: "Weekend trip (demo)",
    items,
    links,
    types: defaultTypes(),
    view: { x: 0, y: 0, scale: 0 },
    updatedAt: Date.now(),
  };
}

export function createEmptyBoard(name: string): Board {
  return { id: uid(), name, items: [], links: [], types: defaultTypes(), view: { x: 0, y: 0, scale: 0 }, updatedAt: Date.now() };
}
