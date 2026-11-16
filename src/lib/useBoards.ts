"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteBoard, loadBoards, saveBoard } from "./storage";
import { createDemoBoard } from "./seed";
import type { Board } from "./types";

const CURRENT_KEY = "tethercorkboard:current";

/** All boards, kept in memory and auto-saved (debounced) to IndexedDB. */
export function useBoards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentId, setCurrentIdState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const saved = useRef(new Map<string, number>());

  useEffect(() => {
    (async () => {
      let all = await loadBoards();
      if (all.length === 0) {
        const demo = createDemoBoard();
        await saveBoard(demo);
        all = [demo];
      }
      for (const b of all) saved.current.set(b.id, b.updatedAt);
      let current: string | null = null;
      try {
        current = localStorage.getItem(CURRENT_KEY);
      } catch {}
      setBoards(all);
      setCurrentIdState(all.some((b) => b.id === current) ? current : all[0].id);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => {
      for (const b of boards) {
        if (saved.current.get(b.id) !== b.updatedAt) {
          saved.current.set(b.id, b.updatedAt);
          void saveBoard(b);
        }
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [boards, ready]);

  const setCurrentId = useCallback((id: string) => {
    setCurrentIdState(id);
    try {
      localStorage.setItem(CURRENT_KEY, id);
    } catch {}
  }, []);

  const update = useCallback((id: string, fn: (b: Board) => Board) => {
    setBoards((prev) => prev.map((b) => (b.id === id ? fn(b) : b)));
  }, []);

  const add = useCallback(
    (board: Board) => {
      setBoards((prev) => [board, ...prev]);
      setCurrentId(board.id);
    },
    [setCurrentId],
  );

  const remove = useCallback(
    (id: string) => {
      void deleteBoard(id);
      saved.current.delete(id);
      setBoards((prev) => {
        const next = prev.filter((b) => b.id !== id);
        if (id === currentId && next.length) setCurrentId(next[0].id);
        return next;
      });
    },
    [currentId, setCurrentId],
  );

  return { boards, currentId, setCurrentId, ready, update, add, remove };
}
