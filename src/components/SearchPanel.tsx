import { useMemo, useState } from "react";
import { searchItems } from "@/lib/search";
import type { Board, Item } from "@/lib/types";
import { Icon } from "./ui/icons";
import { iconBtn, inputField, rowBtn } from "./ui/styles";
import Folded from "./ui/Folded";
import Fastener from "./ui/Fastener";

interface Props {
  board: Board;
  /** Shown or not; when it turns false the panel slides back under the bar before it is removed. */
  open: boolean;
  onPick: (item: Item) => void;
  onClose: () => void;
}

const KIND_ICON: Record<Item["kind"], string> = { section: "▭", note: "▤", image: "▣", pin: "📍" };

/** Search every item on the board (titles, notes, links, type names, custom fields) and jump to one. Works offline. */
export default function SearchPanel({ board, open, onPick, onClose }: Props) {
  const [query, setQuery] = useState("");
  // Stays mounted while it slides away (set during render, the usual way to derive state from a prop).
  const [mounted, setMounted] = useState(open);
  const [visit, setVisit] = useState(0);
  if (open && !mounted) {
    setMounted(true);
    setVisit((v) => v + 1);
  }
  const hits = useMemo(() => searchItems(board, query), [board, query]);
  if (!mounted) return null;

  return (
    // The wrapper sits just under the top bar and clips the panel at the bar's bottom edge, so it slides out from underneath.
    <div
      data-chrome
      className="pointer-events-none absolute inset-x-0 z-25 overflow-hidden px-2 pb-6 pt-1"
      style={{ top: "calc(env(safe-area-inset-top) + 4rem)" }}
    >
      <Folded
        className={`${open ? "search-in" : "search-out"} pointer-events-auto relative mx-auto max-w-xl`}
        onPointerDown={(e) => e.stopPropagation()}
        onAnimationEnd={(e) => {
          if (!open && e.target === e.currentTarget) {
            setMounted(false);
            setQuery("");
          }
        }}
        paperClassName="flex max-h-96 flex-col p-2"
        fasteners={<Fastener id="search" visit={visit} at="bottom-right" chance={0.5} />}
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
            placeholder="Search notes, sections, photos…"
            className={`${inputField} min-w-0 flex-1`}
            aria-label="Search the board"
          />
          <button className={iconBtn} onClick={onClose} aria-label="Close search">
            <Icon name="x" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto">
          {query.trim() && hits.length === 0 && <div className="px-2 py-3 text-sm text-ink-soft">Nothing found.</div>}
          {hits.map(({ item, path, typeName }) => (
            <button
              key={item.id}
              onClick={() => onPick(item)}
              className={`${rowBtn} items-start`}
            >
              <span className="mt-0.5 text-base" aria-hidden>
                {item.kind === "pin" ? item.icon || KIND_ICON.pin : KIND_ICON[item.kind]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{item.title || "(untitled)"}</span>
                <span className="block truncate text-xs text-ink-soft">
                  {[typeName, path.join(" › ")].filter(Boolean).join(" · ") || "Top level"}
                </span>
              </span>
            </button>
          ))}
        </div>
      </Folded>
    </div>
  );
}
