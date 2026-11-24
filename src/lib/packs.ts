import climbing from "../../public/packs/climbing.cork-pack.json";
import researchWeb from "../../public/packs/research-web.cork-pack.json";
import { normalizeType } from "./model";
import type { ItemType } from "./types";

/**
 * A pack is a small shareable file of item types (names, colours, fields). Loading one adds its types to a board
 * without touching the board's items, so one app can be set up for climbing trips, renovations, events and so on.
 */
export interface Pack {
  format: "tethercorkpack";
  version: 1;
  name: string;
  description?: string;
  types: ItemType[];
}

/** Read a pack from untrusted JSON. Returns null if it is not a pack or holds no usable types. */
export function parsePack(raw: unknown): Pack | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r.format !== "tethercorkpack" || !Array.isArray(r.types)) return null;
  const types = r.types.map(normalizeType).filter((t): t is ItemType => !!t);
  if (types.length === 0) return null;
  return {
    format: "tethercorkpack",
    version: 1,
    name: typeof r.name === "string" && r.name ? r.name : "Untitled pack",
    ...(typeof r.description === "string" && r.description ? { description: r.description } : {}),
    types,
  };
}

/** Add a pack's types to a board's types. A type the board already has (same id) is kept as it is, never overwritten. */
export function mergePack(existing: ItemType[], pack: Pack): { types: ItemType[]; added: number; skipped: number } {
  const have = new Set(existing.map((t) => t.id));
  const fresh = pack.types.filter((t) => !have.has(t.id));
  return { types: [...existing, ...fresh], added: fresh.length, skipped: pack.types.length - fresh.length };
}

/** The board's types as a pack file the user can share. */
export function makePack(name: string, types: ItemType[]): Pack {
  return { format: "tethercorkpack", version: 1, name, types };
}

/** Packs that ship with the app (also available as downloadable files under /packs). */
export const BUILT_IN_PACKS: Pack[] = [parsePack(climbing), parsePack(researchWeb)].filter((p): p is Pack => !!p);
