import type { Item } from "@/lib/types";

interface Props {
  /** Where the camera is, outermost first. Empty = looking at the whole board. */
  crumbs: Item[];
  onAll: () => void;
  onPick: (item: Item) => void;
}

const chip =
  "max-w-40 truncate rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-stone-800 shadow active:bg-stone-200 dark:bg-zinc-600/95 dark:text-zinc-50 dark:active:bg-zinc-500";

/** Path along the top: tap any step to zoom out to it. The last step is where you are. */
export default function Breadcrumb({ crumbs, onAll, onPick }: Props) {
  return (
    <nav
      aria-label="Where you are"
      className="absolute left-3 top-14 z-20 flex max-w-full flex-wrap items-center gap-1 pr-3"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button className={chip} onClick={onAll}>
        All
      </button>
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={c.id} className="flex items-center gap-1">
            <span className="text-sm font-bold text-white drop-shadow" aria-hidden>
              ›
            </span>
            <button className={`${chip} ${last ? "ring-2 ring-sky-500" : ""}`} onClick={() => onPick(c)} aria-current={last ? "location" : undefined}>
              {c.title || c.kind}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
