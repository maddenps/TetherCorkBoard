"use client";

import { useState } from "react";

const KEY = "tether-hint-dismissed-v3";

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** A one-time reminder of the navigation gestures. Stays until dismissed. */
export default function GestureHint() {
  const [hidden, setHidden] = useState(wasDismissed);
  if (hidden) return null;
  return (
    <div
      className="absolute bottom-3 left-3 z-20 max-w-xs rounded-lg bg-black/65 p-3 text-xs leading-snug text-white shadow-lg"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div>
        <b>Double-click</b> an item to zoom in. <b>Right-click</b> (or press and hold) to select it, then drag its <b>Move</b> handle or grips, or press <b>Settings</b>. <b>Esc</b>, the Up button or a
        double-click on the bare board zooms out.
      </div>
      <button
        className="mt-2 rounded-full bg-white/90 px-3 py-1 font-semibold text-stone-800"
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
    </div>
  );
}
