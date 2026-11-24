"use client";

import { useState } from "react";
import Folded from "./ui/Folded";
import Fastener from "./ui/Fastener";

const KEY = "tether-hint-dismissed-v3";

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Forget that the tips were dismissed, so they show again. */
export function resetHint() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Preference only.
  }
}

/** A one-time reminder of the navigation gestures, on a taped-up paper card. Stays until dismissed. */
export default function GestureHint() {
  const [hidden, setHidden] = useState(wasDismissed);
  if (hidden) return null;
  return (
    <Folded
      data-chrome
      className="absolute left-3 z-20 max-w-xs"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.75rem)", maxWidth: "calc(100% - 5.5rem)" }}
      onPointerDown={(e) => e.stopPropagation()}
      paperClassName="p-4 text-sm leading-snug"
      fasteners={<Fastener id="hint" at="top-left" chance={0.9} />}
    >
      <div className="text-base font-bold">Getting around</div>
      <ul className="mt-1 space-y-1 text-ink-soft">
        <li>
          <b className="text-ink">Double-click</b> an item to zoom in. <b className="text-ink">Esc</b>, the Up button or a double-click on the bare board zooms out.
        </li>
        <li>
          <b className="text-ink">Right-click</b> (or press and hold) to select it, then use its Move handle, grips and cog.
        </li>
      </ul>
      <button
        className="chrome-focus mt-3 h-10 rounded-ui bg-thread px-4 text-sm font-bold text-on-thread active:translate-y-px"
        onClick={() => {
          setHidden(true);
          try {
            localStorage.setItem(KEY, "1");
          } catch {
            // Preference only; it just shows again next time.
          }
        }}
      >
        Got it
      </button>
    </Folded>
  );
}
