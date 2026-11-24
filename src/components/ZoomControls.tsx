"use client";

import { Icon } from "./ui/icons";
import { iconBtn } from "./ui/styles";

interface Props {
  scale: number;
  /** How many levels deep the board is showing right now (1 = just the top level). */
  level: number;
  canGoUp: boolean;
  onUp: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

/** Bottom-right: where you are (zoom and level), then one vertical pill of up / zoom in / zoom out / fit all. */
export default function ZoomControls({ scale, level, canGoUp, onUp, onZoomIn, onZoomOut, onFit }: Props) {
  return (
    <div
      data-chrome
      className="absolute right-3 z-20 flex flex-col items-end gap-2"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="rounded-ui border border-line bg-paper/95 px-3 py-1 text-xs font-semibold text-ink-soft shadow-paper">
        {Math.round(scale * 100)}% · level {level}
      </div>
      <div className="flex flex-col gap-0.5 rounded-ui border border-line bg-paper/95 p-1 shadow-paper">
        <button
          className={`${iconBtn} disabled:opacity-35`}
          onClick={onUp}
          disabled={!canGoUp}
          aria-label="Up one level"
          title="Up one level (Esc, or double-click the board)"
        >
          <Icon name="up" />
        </button>
        <button className={iconBtn} onClick={onZoomIn} aria-label="Zoom in">
          <Icon name="plus" />
        </button>
        <button className={iconBtn} onClick={onZoomOut} aria-label="Zoom out">
          <Icon name="minus" />
        </button>
        <button className={iconBtn} onClick={onFit} aria-label="Fit everything on screen" title="Fit everything on screen">
          <Icon name="fit" />
        </button>
      </div>
    </div>
  );
}
