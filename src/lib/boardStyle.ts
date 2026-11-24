"use client";

import { useCallback, useState } from "react";

export type BoardStyle = "cork" | "whiteboard";

/**
 * The whiteboard surface is switched off for now (not appealing enough yet): the menu hides the choice and every device
 * shows cork, even one that saved "whiteboard" earlier. All the whiteboard drawing code is still here; set this to true
 * to bring the choice back, or delete the whiteboard code if it is not coming back (see Specs/TODO.md).
 */
export const WHITEBOARD_ENABLED = false;

const KEY = "tether-board-style";

/** Which surface the board is drawn on. A viewing preference only; it is never saved into a board. */
export function useBoardStyle() {
  const [style, setStyleState] = useState<BoardStyle>(() => {
    try {
      return WHITEBOARD_ENABLED && localStorage.getItem(KEY) === "whiteboard" ? "whiteboard" : "cork";
    } catch {
      return "cork";
    }
  });

  const setStyle = useCallback((next: BoardStyle) => {
    setStyleState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Private mode: the choice just won't be remembered.
    }
  }, []);

  return { boardStyle: style, setBoardStyle: setStyle };
}
