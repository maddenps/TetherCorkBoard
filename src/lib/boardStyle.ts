"use client";

import { useCallback, useState } from "react";

export type BoardStyle = "cork" | "whiteboard";

const KEY = "tether-board-style";

/** Which surface the board is drawn on. A viewing preference only; it is never saved into a board. */
export function useBoardStyle() {
  const [style, setStyleState] = useState<BoardStyle>(() => {
    try {
      return localStorage.getItem(KEY) === "whiteboard" ? "whiteboard" : "cork";
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
