"use client";

import { useRef } from "react";
import { createEmptyBoard } from "@/lib/seed";
import { uid } from "@/lib/board";
import { useBoards } from "@/lib/useBoards";
import { useTheme } from "@/lib/theme";
import type { Board as BoardData, BoardExport } from "@/lib/types";
import Board from "./Board";

const btn =
  "shrink-0 rounded-md bg-stone-300 px-2.5 py-1.5 text-sm font-medium text-stone-900 active:bg-stone-400 dark:bg-zinc-500 dark:text-white dark:active:bg-zinc-400";

export default function Workspace() {
  const { boards, currentId, setCurrentId, ready, update, add, remove } = useBoards();
  const { theme, setTheme } = useTheme();
  const importRef = useRef<HTMLInputElement>(null);
  const current = boards.find((b) => b.id === currentId);

  if (!ready || !current) {
    return <div className="flex h-dvh items-center justify-center bg-amber-200 text-stone-800 dark:bg-zinc-600 dark:text-zinc-100">Loading…</div>;
  }

  function newBoard() {
    const name = prompt("Name for the new board?", "New project");
    if (name) add(createEmptyBoard(name));
  }

  function rename() {
    const name = prompt("Rename board", current!.name);
    if (name) update(current!.id, (b) => ({ ...b, name, updatedAt: Date.now() }));
  }

  function del() {
    if (confirm(`Delete "${current!.name}" permanently? Export it first if you might want it back.`)) {
      if (boards.length === 1) add(createEmptyBoard("New project"));
      remove(current!.id);
    }
  }

  function exportBoard() {
    const data: BoardExport = { format: "tethercorkboard", version: 1, board: current! };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${current!.name.replace(/[^\w-]+/g, "_") || "board"}.cork.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importBoard(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as BoardExport;
      if (data.format !== "tethercorkboard" || !Array.isArray(data.board?.items)) throw new Error("bad format");
      const board: BoardData = { ...data.board, id: uid(), updatedAt: Date.now() };
      add(board);
    } catch {
      alert("That file is not a Tether Cork Board export.");
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="z-10 flex items-center gap-2 overflow-x-auto bg-stone-100 px-3 py-2 text-stone-900 dark:bg-zinc-700 dark:text-white">
        <span className="shrink-0 font-bold">📌 Tether</span>
        <select
          value={current.id}
          onChange={(e) => setCurrentId(e.target.value)}
          className="min-w-0 max-w-40 rounded-md bg-stone-300 px-2 py-1.5 text-sm text-stone-900 dark:bg-zinc-500 dark:text-white"
        >
          {boards.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <button className={btn} onClick={newBoard}>New</button>
        <button className={btn} onClick={rename}>Rename</button>
        <button className={btn} onClick={exportBoard}>Export</button>
        <button className={btn} onClick={() => importRef.current?.click()}>Import</button>
        <button className={btn} onClick={del}>Delete</button>
        <button className={btn} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle light or dark theme">
          {theme === "dark" ? "☀ Light" : "☾ Dark"}
        </button>
        <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={importBoard} />
      </header>
      <main className="min-h-0 flex-1">
        <Board key={current.id} board={current} update={update} />
      </main>
    </div>
  );
}
