import type { Board, Item } from "./types";

export interface SearchHit {
  item: Item;
  /** Names of the sections it sits in, outermost first. */
  path: string[];
  typeName: string;
  score: number;
}

/** Everything searchable about an item, lower-cased. Pure, so it can be unit tested. */
function haystack(item: Item, typeName: string, fieldText: string): string {
  return [item.title, item.text, item.url ?? "", typeName, fieldText].join("\n").toLowerCase();
}

/** Find items by title, notes, link, type name or any custom field value. Title matches rank first. */
export function searchItems(board: Board, query: string, limit = 40): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/);
  const byId = new Map(board.items.map((i) => [i.id, i]));
  const typesById = new Map(board.types.map((t) => [t.id, t]));
  const hits: SearchHit[] = [];

  for (const item of board.items) {
    const type = item.typeId ? typesById.get(item.typeId) : undefined;
    const fieldText = Object.values(item.fields ?? {})
      .filter((v) => typeof v === "string" || typeof v === "number")
      .join(" ");
    const hay = haystack(item, type?.name ?? "", fieldText);
    if (!words.every((w) => hay.includes(w))) continue;

    const title = item.title.toLowerCase();
    let score = 1;
    if (title === q) score = 100;
    else if (title.startsWith(q)) score = 60;
    else if (words.every((w) => title.includes(w))) score = 40;

    const path: string[] = [];
    const seen = new Set<string>([item.id]);
    let cur = item.parentId ? byId.get(item.parentId) : undefined;
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      path.unshift(cur.title || "(untitled)");
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    hits.push({ item, path, typeName: type?.name ?? "", score });
  }

  hits.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
  return hits.slice(0, limit);
}
