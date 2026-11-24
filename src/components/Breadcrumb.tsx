import type { Item } from "@/lib/types";
import { Icon } from "./ui/icons";
import { chip } from "./ui/styles";

interface Props {
  /** Where the camera is, outermost first. Empty = looking at the whole board. */
  crumbs: Item[];
  onAll: () => void;
  onPick: (item: Item) => void;
}

/** A wobbly red marker line drawn under the current step, two strokes like it was gone over twice. */
function MarkerUnderline() {
  return (
    <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-2 bottom-0.5 h-2" aria-hidden>
      <g fill="none" stroke="var(--thread)" strokeLinecap="round" vectorEffect="non-scaling-stroke">
        <path d="M1 6.5C14 3 22 8 38 5.2S62 7.8 76 4.6 92 6 99 3.8" strokeWidth={2.4} vectorEffect="non-scaling-stroke" />
        <path d="M6 8.2C24 6.2 40 9 60 7S88 8.4 96 6.6" strokeWidth={1.4} opacity={0.6} vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}

/** Path under the top bar: tap any step to zoom out to it. The last step (where you are) is outlined in thread red. */
export default function Breadcrumb({ crumbs, onAll, onPick }: Props) {
  return (
    <nav
      data-chrome
      aria-label="Where you are"
      className="absolute inset-x-2 z-20 mx-auto flex max-w-4xl flex-wrap items-center gap-1"
      style={{ top: "calc(env(safe-area-inset-top) + 4.25rem)" }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button className={chip} onClick={onAll}>
        All
      </button>
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={c.id} className="flex items-center gap-1">
            <Icon name="chevronRight" className="h-4 w-4 text-ink drop-shadow" />
            <button className={`${chip} relative`} onClick={() => onPick(c)} aria-current={last ? "location" : undefined}>
              {c.title || c.kind}
              {last && <MarkerUnderline />}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
