import { useMemo, useState } from "react";
import { searchItems } from "@/lib/search";
import type { Board, Item } from "@/lib/types";

interface Props {
  board: Board;
  onPick: (item: Item) => void;
  onClose: () => void;
}

const KIND_ICON: Record<Item["kind"], string> = { section: "▭", note: "▤", image: "▣", pin: "📍" };

/** Search every item on the board (titles, notes, links, type names, custom fields) and jump to one. Works offline. */
export default function SearchPanel({ board, onPick, onClose }: Props) {
  const [query, setQuery] = useState("");
  const hits = useMemo(() => searchItems(board, query), [board, query]);

  return (
    <div
      className="absolute inset-x-3 top-14 z-30 flex max-h-96 flex-col sm:right-auto sm:w-80 rounded-lg bg-stone-50 p-2 text-stone-900 shadow-xl dark:bg-zinc-700 dark:text-zinc-50"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center gap-2">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter" && hits[0]) onPick(hits[0].item);
          }}
          placeholder="Search routes, boulders, notes…"
          className="min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-2.5 py-2 text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-zinc-500 dark:bg-zinc-600 dark:text-white"
          aria-label="Search the board"
        />
        <button className="rounded-md bg-stone-300 px-3 py-2 text-sm font-medium dark:bg-zinc-500" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="min-h-0 overflow-y-auto">
        {query.trim() && hits.length === 0 && <div className="px-2 py-3 text-sm text-stone-500 dark:text-zinc-300">Nothing found.</div>}
        {hits.map(({ item, path, typeName }) => (
          <button
            key={item.id}
            onClick={() => onPick(item)}
            className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left hover:bg-stone-200 active:bg-stone-300 dark:hover:bg-zinc-600 dark:active:bg-zinc-500"
          >
            <span className="mt-0.5 text-base" aria-hidden>
              {item.kind === "pin" ? item.icon || KIND_ICON.pin : KIND_ICON[item.kind]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{item.title || "(untitled)"}</span>
              <span className="block truncate text-xs text-stone-500 dark:text-zinc-300">
                {[typeName, path.join(" › ")].filter(Boolean).join(" · ") || "Top level"}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
