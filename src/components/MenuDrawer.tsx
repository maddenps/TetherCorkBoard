"use client";

import type { BoardStyle } from "@/lib/boardStyle";
import type { Theme } from "@/lib/theme";
import type { Board } from "@/lib/types";
import Drawer from "./ui/Drawer";
import { Icon } from "./ui/icons";
import Segmented from "./ui/Segmented";
import { dangerBtn, groupLabel, rowBtn, secondaryBtn } from "./ui/styles";
import { setFastenerMode, useFastenerMode } from "@/lib/fasteners";
import { WHITEBOARD_ENABLED } from "@/lib/boardStyle";

interface Props {
  open: boolean;
  onClose: () => void;
  boards: Board[];
  currentId: string;
  onPickBoard: (id: string) => void;
  onNewBoard: () => void;
  onRename: () => void;
  onDelete: () => void;
  onExport: () => void;
  onImport: () => void;
  theme: Theme;
  onTheme: (t: Theme) => void;
  boardStyle: BoardStyle;
  onBoardStyle: (s: BoardStyle) => void;
  onOpenTypes: () => void;
  onShowTips: () => void;
}

/** Left-hand drawer: boards, this board's file actions, how it looks, and customising item types. */
export default function MenuDrawer(p: Props) {
  const fastenerMode = useFastenerMode();
  // Run an action and close the drawer (the action may open a dialog or prompt).
  const then = (fn: () => void) => () => {
    p.onClose();
    fn();
  };
  return (
    <Drawer open={p.open} side="left" title="Tether" subtitle="Boards, backup and settings" onClose={p.onClose}>
      <div className={groupLabel}>Your boards</div>
      {p.boards.map((b) => {
        const on = b.id === p.currentId;
        return (
          <button key={b.id} className={`${rowBtn} ${on ? "bg-paper-2" : ""}`} onClick={then(() => p.onPickBoard(b.id))} aria-current={on ? "true" : undefined}>
            <Icon name="board" className={`h-5 w-5 ${on ? "text-thread" : "text-ink-soft"}`} />
            <span className={`min-w-0 flex-1 truncate ${on ? "font-bold" : "font-medium"}`}>{b.name}</span>
            {on && <Icon name="check" className="h-4 w-4 text-thread" />}
          </button>
        );
      })}
      <div className="px-1 pt-2">
        <button className={`${secondaryBtn} w-full`} onClick={then(p.onNewBoard)}>
          <Icon name="plus" className="h-4 w-4" /> New board
        </button>
      </div>

      <div className={groupLabel}>This board</div>
      <button className={rowBtn} onClick={then(p.onRename)}>
        <Icon name="pencil" className="h-5 w-5 text-ink-soft" /> Rename
      </button>
      <button className={rowBtn} onClick={then(p.onExport)}>
        <Icon name="download" className="h-5 w-5 text-ink-soft" /> Save a backup file
      </button>
      <button className={rowBtn} onClick={then(p.onImport)}>
        <Icon name="upload" className="h-5 w-5 text-ink-soft" /> Open a board file…
      </button>

      <div className={groupLabel}>Look</div>
      <div className="space-y-2 px-1">
        <Segmented
          label="Theme"
          value={p.theme}
          onChange={p.onTheme}
          options={[
            { value: "light", label: "Light", icon: "sun" },
            { value: "dark", label: "Dark", icon: "moon" },
          ]}
        />
        {WHITEBOARD_ENABLED && (
          <Segmented
            label="Board surface"
            value={p.boardStyle}
            onChange={p.onBoardStyle}
            options={[
              { value: "cork", label: "Cork", icon: "layers" },
              { value: "whiteboard", label: "Whiteboard", icon: "board" },
            ]}
          />
        )}
        <div>
          <div className="mb-1 px-2 text-sm font-semibold text-ink-soft">Office supplies on panels</div>
          <Segmented
            label="Office supplies on panels"
            value={fastenerMode}
            onChange={setFastenerMode}
            options={[
              { value: "always", label: "Always" },
              { value: "sometimes", label: "Sometimes" },
              { value: "off", label: "Off" },
            ]}
          />
        </div>
      </div>

      <div className={groupLabel}>Customise</div>
      <button className={rowBtn} onClick={then(p.onOpenTypes)}>
        <Icon name="tag" className="h-5 w-5 text-ink-soft" />
        <span className="flex-1 font-medium">Item types and packs</span>
        <Icon name="chevronRight" className="h-4 w-4 text-ink-faint" />
      </button>

      <div className={groupLabel}>Help</div>
      <button className={rowBtn} onClick={then(p.onShowTips)}>
        <Icon name="help" className="h-5 w-5 text-ink-soft" /> Show the gesture tips
      </button>

      <div className="px-1 pt-6">
        <button className={`${dangerBtn} w-full`} onClick={then(p.onDelete)}>
          <Icon name="trash" className="h-4 w-4" /> Delete this board
        </button>
      </div>
    </Drawer>
  );
}
