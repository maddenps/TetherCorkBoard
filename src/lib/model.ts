import { PAPER_COLORS, uid } from "./board";
import type { Board, FieldDef, FieldType, FieldValue, Item, ItemKind, ItemType, Link, LinkStyle } from "./types";

/** Pin and connector palettes (pins keep their colour in `item.color`, connectors in `link.color`). */
export const PIN_COLORS = ["#dc2626", "#2563eb", "#16a34a", "#f59e0b", "#7c3aed", "#0f172a"];
export const PIN_ICONS = ["📍", "🅿️", "🏠", "⛰️", "🧗", "⛺", "🚗", "🥾", "💧", "⭐", "⚠️"];
export const CONNECTOR_COLORS = ["#b91c1c", "#2563eb", "#15803d", "#f59e0b", "#7c3aed", "#111827"];
export const LINK_STYLES: { value: LinkStyle; label: string }[] = [
  { value: "string", label: "String" },
  { value: "line", label: "Line" },
  { value: "dashed", label: "Dashed" },
  { value: "arrow", label: "Arrow" },
];
export const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "longtext", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "link", label: "Link" },
  { value: "checkbox", label: "Checkbox" },
  { value: "select", label: "Choice" },
];

/** Starter types. They are ordinary types: rename them, change their fields or delete them. */
export function defaultTypes(): ItemType[] {
  const [yellow, pink, green, blue, purple] = PAPER_COLORS;
  const f = (id: string, name: string, type: FieldType, options?: string[]): FieldDef => ({ id, name, type, ...(options ? { options } : {}) });
  return [
    {
      id: "type-area",
      name: "Area",
      kind: "section",
      color: green,
      fields: [f("area-access", "Access", "longtext"), f("area-map", "Map link", "link")],
    },
    {
      id: "type-location",
      name: "Location",
      kind: "section",
      color: pink,
      fields: [f("loc-parking", "Parking", "longtext"), f("loc-directions", "Directions", "longtext"), f("loc-link", "Link", "link")],
    },
    {
      id: "type-stay",
      name: "Stay",
      kind: "section",
      color: purple,
      fields: [f("stay-address", "Address", "text"), f("stay-times", "Check-in / out", "text"), f("stay-link", "Booking link", "link")],
    },
    {
      id: "type-boulder",
      name: "Boulder",
      kind: "section",
      color: blue,
      fields: [f("boulder-approach", "Approach", "longtext"), f("boulder-landing", "Landing", "text")],
    },
    {
      id: "type-route",
      name: "Route",
      kind: "note",
      color: yellow,
      fields: [
        f("route-grade", "Grade", "text"),
        f("route-status", "Status", "select", ["To try", "Project", "Sent"]),
        f("route-video", "Video", "link"),
        f("route-beta", "Beta", "longtext"),
      ],
    },
  ];
}

const KINDS: ItemKind[] = ["section", "note", "image", "pin"];
const FIELD_KINDS = new Set<FieldType>(["text", "longtext", "number", "link", "checkbox", "select"]);
const LINK_KINDS = new Set<LinkStyle>(["string", "line", "dashed", "arrow"]);

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);

function normalizeField(raw: unknown): FieldDef | null {
  if (!isObj(raw) || typeof raw.id !== "string") return null;
  const type = FIELD_KINDS.has(raw.type as FieldType) ? (raw.type as FieldType) : "text";
  const options = Array.isArray(raw.options) ? raw.options.filter((o): o is string => typeof o === "string") : undefined;
  return { id: raw.id, name: str(raw.name, "Field"), type, ...(type === "select" ? { options: options ?? [] } : {}) };
}

function normalizeType(raw: unknown): ItemType | null {
  if (!isObj(raw) || typeof raw.id !== "string") return null;
  const fields = Array.isArray(raw.fields) ? raw.fields.map(normalizeField).filter((x): x is FieldDef => !!x) : [];
  return {
    id: raw.id,
    name: str(raw.name, "Type"),
    kind: raw.kind === "section" ? "section" : "note",
    color: str(raw.color, PAPER_COLORS[0]),
    fields,
  };
}

function normalizeItem(raw: unknown): Item | null {
  if (!isObj(raw) || typeof raw.id !== "string") return null;
  const fields: Record<string, FieldValue> = {};
  if (isObj(raw.fields)) {
    for (const [k, v] of Object.entries(raw.fields)) if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") fields[k] = v;
  }
  const kind = KINDS.includes(raw.kind as ItemKind) ? (raw.kind as ItemKind) : "note";
  return {
    id: raw.id,
    parentId: typeof raw.parentId === "string" ? raw.parentId : null,
    kind,
    x: num(raw.x, 0),
    y: num(raw.y, 0),
    w: Math.max(20, num(raw.w, 180)),
    h: Math.max(20, num(raw.h, 100)),
    title: str(raw.title),
    text: str(raw.text),
    color: str(raw.color, PAPER_COLORS[0]),
    ...(typeof raw.imageData === "string" ? { imageData: raw.imageData } : {}),
    ...(typeof raw.typeId === "string" ? { typeId: raw.typeId } : {}),
    ...(Object.keys(fields).length ? { fields } : {}),
    ...(typeof raw.url === "string" && raw.url ? { url: raw.url } : {}),
    ...(typeof raw.mapData === "string" ? { mapData: raw.mapData } : {}),
    ...(typeof raw.icon === "string" ? { icon: raw.icon } : {}),
  };
}

function normalizeLink(raw: unknown): Link | null {
  if (!isObj(raw) || typeof raw.id !== "string" || typeof raw.from !== "string" || typeof raw.to !== "string") return null;
  return {
    id: raw.id,
    from: raw.from,
    to: raw.to,
    ...(typeof raw.label === "string" && raw.label ? { label: raw.label } : {}),
    ...(typeof raw.color === "string" ? { color: raw.color } : {}),
    ...(LINK_KINDS.has(raw.style as LinkStyle) ? { style: raw.style as LinkStyle } : {}),
  };
}

/**
 * Turns anything read from IndexedDB or an imported file into a safe Board, defaulting whatever is missing
 * (old boards have no types, links have no style, and so on). Returns null if it isn't a board at all.
 */
export function normalizeBoard(raw: unknown): Board | null {
  if (!isObj(raw) || typeof raw.id !== "string" || !Array.isArray(raw.items)) return null;
  const items = raw.items.map(normalizeItem).filter((x): x is Item => !!x);
  const ids = new Set(items.map((i) => i.id));
  const links = (Array.isArray(raw.links) ? raw.links : []).map(normalizeLink).filter((x): x is Link => !!x && ids.has(x.from) && ids.has(x.to));
  const types = Array.isArray(raw.types) ? raw.types.map(normalizeType).filter((x): x is ItemType => !!x) : defaultTypes();
  const v = isObj(raw.view) ? raw.view : {};
  return {
    id: raw.id,
    name: str(raw.name, "Untitled board"),
    items,
    links,
    types,
    view: { x: num(v.x, 0), y: num(v.y, 0), scale: num(v.scale, 0) },
    updatedAt: num(raw.updatedAt, Date.now()),
  };
}

/** Only ever open http(s) links. Adds https:// to things like "youtu.be/abc". Returns null if it isn't a usable link. */
export function safeUrl(raw: string | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : s.includes(".") ? `https://${s}` : "";
  if (!withScheme) return null;
  try {
    const u = new URL(withScheme);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

/** Short lines for an item's custom field values, for showing on the card. */
export function fieldSummary(type: ItemType | undefined, item: Item): string[] {
  if (!type || !item.fields) return [];
  const out: string[] = [];
  for (const def of type.fields) {
    const v = item.fields[def.id];
    if (v === undefined || v === "" || v === false) continue;
    if (def.type === "checkbox") out.push(`✓ ${def.name}`);
    else if (def.type === "link") out.push(`🔗 ${def.name}`);
    else out.push(`${def.name}: ${String(v)}`);
  }
  return out;
}

export function newField(): FieldDef {
  return { id: uid(), name: "New field", type: "text" };
}

export function newType(): ItemType {
  return { id: uid(), name: "New type", kind: "note", color: PAPER_COLORS[0], fields: [] };
}
