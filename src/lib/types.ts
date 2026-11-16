export type ItemKind = "section" | "note" | "image";

/** A thing pinned to the board. Positions are in world coordinates (absolute). */
export interface Item {
  id: string;
  /** Section this item lives inside. Defines the zoom hierarchy. null = top level. */
  parentId: string | null;
  kind: ItemKind;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  text: string;
  color: string;
  /** Downscaled JPEG data URL for image items. */
  imageData?: string;
}

/** A piece of string tied between two items. */
export interface Link {
  id: string;
  from: string;
  to: string;
}

/** Pan (x, y in screen px) and zoom. scale <= 0 means "not set yet, fit to content". */
export interface View {
  x: number;
  y: number;
  scale: number;
}

export interface Board {
  id: string;
  name: string;
  items: Item[];
  links: Link[];
  view: View;
  updatedAt: number;
}

export interface BoardExport {
  format: "tethercorkboard";
  version: 1;
  board: Board;
}
