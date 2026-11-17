export type ItemKind = "section" | "note" | "image" | "pin";

/** A custom field value on an item. Keyed by the field's id, so renaming a field never loses data. */
export type FieldValue = string | number | boolean;

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
  /** Item type (board.types) this item was made from. A missing or deleted type just means "untyped". */
  typeId?: string;
  /** Values for the type's fields, keyed by field id. */
  fields?: Record<string, FieldValue>;
  /** A web link on any item (e.g. a YouTube video). Only http(s) links are ever opened. */
  url?: string;
  /** Sections: a map (or any picture) drawn behind the section's contents. Downscaled JPEG data URL. */
  mapData?: string;
  /** Pins: the emoji shown in the pin's head. */
  icon?: string;
}

export type LinkStyle = "string" | "line" | "dashed" | "arrow";

/** A connector between two items: a piece of string, a plain or dashed line, or an arrow. */
export interface Link {
  id: string;
  from: string;
  to: string;
  label?: string;
  color?: string;
  style?: LinkStyle;
}

export type FieldType = "text" | "longtext" | "number" | "link" | "checkbox" | "select";

export interface FieldDef {
  id: string;
  name: string;
  type: FieldType;
  /** Choices for a "select" field. */
  options?: string[];
}

/** An item type designed in the app: a name, a paper colour and its own fields. */
export interface ItemType {
  id: string;
  name: string;
  /** What it looks like: a sticky note or a section that can hold other items. */
  kind: "note" | "section";
  color: string;
  fields: FieldDef[];
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
  /** Item types for this board. Old boards without them get the starter types when loaded. */
  types: ItemType[];
  view: View;
  updatedAt: number;
}

export interface BoardExport {
  format: "tethercorkboard";
  version: 1;
  board: Board;
}
