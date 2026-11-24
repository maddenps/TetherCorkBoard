"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";
import { tornEdgeImage } from "@/lib/tornEdge";
import { Icon } from "./icons";
import { iconBtn } from "./styles";
import { useEscape } from "./useEscape";

interface Props {
  open: boolean;
  side: "left" | "right";
  title: string;
  /** One line under the title saying what the drawer is for. */
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * A slide-out panel: paper stock with a red margin line, sliding in from the left or right over a dimmed board.
 * Always mounted (so it can animate out); while closed it is hidden and inert. Escape or a tap outside closes it.
 */
export default function Drawer({ open, side, title, subtitle, onClose, children }: Props) {
  useEscape(open, onClose);
  const left = side === "left";
  // The torn inner edge: its own pattern per drawer, in both theme colours (paper, torn fibre rim, shadow; see lib/tornEdge.ts).
  const edge = useMemo(
    () =>
      ({
        "--edge-light": tornEdgeImage(left ? 7311 : 40213, "#fbf7ee", "#fffefa", "rgba(60,40,20,0.4)"),
        "--edge-dark": tornEdgeImage(left ? 7311 : 40213, "#2b251f", "#6b5f52", "rgba(0,0,0,0.6)"),
      }) as CSSProperties,
    [left],
  );
  return (
    <>
      <div data-open={open} data-modal className="drawer-scrim fixed inset-0 z-40 bg-ink/45" onClick={onClose} aria-hidden />
      <aside
        data-open={open}
        data-side={side}
        data-modal
        role="dialog"
        aria-label={title}
        aria-hidden={!open}
        inert={!open}
        className={`drawer fixed inset-y-0 z-50 flex w-11/12 max-w-104 flex-col bg-paper text-ink shadow-lift ${
          // drawn 1.5rem wider on the outer edge (hidden off-screen) so the springy overshoot never shows a gap
          left ? "-left-6 pl-6" : "-right-6 pr-6"
        } ${open ? "translate-x-0" : left ? "-translate-x-full" : "translate-x-full"}`}
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)", ...edge }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <header className="relative flex items-start justify-between gap-2 border-b border-line px-4 pb-3 pt-4">
          <div className="min-w-0 pl-2">
            <h2 className="truncate text-xl font-bold leading-tight">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
          </div>
          <button className={`${iconBtn} drawer-close`} onClick={onClose} aria-label={`Close ${title}`}>
            <Icon name="x" />
          </button>
        </header>
        <div className="drawer-body min-h-0 flex-1 overflow-y-auto px-3 pb-6">{children}</div>
      </aside>
    </>
  );
}
