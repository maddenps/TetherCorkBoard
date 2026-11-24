"use client";

import { useRef, useState } from "react";
import { createEmptyBoard } from "@/lib/seed";
import { uid } from "@/lib/board";
import { normalizeBoard } from "@/lib/model";
import { useBoards } from "@/lib/useBoards";
import { useTheme } from "@/lib/theme";
import { useBoardStyle } from "@/lib/boardStyle";
import type { Board as BoardData, BoardExport } from "@/lib/types";
import Board from "./Board";
import MenuDrawer from "./MenuDrawer";
import TypesEditor from "./TypesEditor";
import { resetHint } from "./GestureHint";

export default function Workspace() {
  const { boards, currentId, setCurrentId, ready, update, add, remove } = useBoards();
  const { theme, setTheme } = useTheme();
  const { boardStyle, setBoardStyle } = useBoardStyle();
  const importRef = useRef<HTMLInputElement>(null);
  const [typesOpen, setTypesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Bumped to bring the gesture tips back after they were dismissed.
  const [tipsKey, setTipsKey] = useState(0);
  const current = boards.find((b) => b.id === currentId);

  if (!ready || !current) {
    return <div className="flex h-dvh items-center justify-center bg-paper-2 text-lg font-semibold text-ink-soft">Loading…</div>;
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
      const data = JSON.parse(await file.text()) as Partial<BoardExport> | null;
      if (data?.format !== "tethercorkboard") throw new Error("bad format");
      const clean = normalizeBoard(data.board);
      if (!clean) throw new Error("bad board");
      const board: BoardData = { ...clean, id: uid(), updatedAt: Date.now() };
      add(board);
    } catch {
      alert("That file is not a Tether Cork Board export.");
    }
  }

  return (
    <div className="h-dvh bg-paper-2">
      <Board
        key={current.id}
        board={current}
        update={update}
        boardStyle={boardStyle}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenTypes={() => setTypesOpen(true)}
        tipsKey={tipsKey}
      />
      <MenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        boards={boards}
        currentId={current.id}
        onPickBoard={setCurrentId}
        onNewBoard={newBoard}
        onRename={rename}
        onDelete={del}
        onExport={exportBoard}
        onImport={() => importRef.current?.click()}
        theme={theme}
        onTheme={setTheme}
        boardStyle={boardStyle}
        onBoardStyle={setBoardStyle}
        onOpenTypes={() => setTypesOpen(true)}
        onShowTips={() => {
          resetHint();
          setTipsKey((k) => k + 1);
        }}
      />
      <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={importBoard} />
      {typesOpen && (
        <TypesEditor
          types={current.types}
          onChange={(types) => update(current.id, (b) => ({ ...b, types, updatedAt: Date.now() }))}
          onClose={() => setTypesOpen(false)}
        />
      )}
    </div>
  );
}
