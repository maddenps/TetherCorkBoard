"use client";

import { Icon } from "./ui/icons";
import { iconBtn, primaryBtn } from "./ui/styles";

interface Props {
  boardName: string;
  onMenu: () => void;
  onSearch: () => void;
  onAdd: () => void;
  searchOpen: boolean;
}

/**
 * The only permanent chrome: one slim paper bar floating over the top of the board. Menu on the left (boards,
 * backup, look, types), the board's name, then search and the red Add button on the right.
 */
export default function TopBar({ boardName, onMenu, onSearch, onAdd, searchOpen }: Props) {
  return (
    <div
      data-chrome
      className="absolute inset-x-0 top-0 z-30 px-2"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-1 rounded-ui border border-line bg-paper/95 px-1.5 text-ink shadow-paper">
        <button className={iconBtn} onClick={onMenu} aria-label="Open menu">
          <Icon name="menu" className="h-6 w-6" />
        </button>
        <button
          className="chrome-focus flex min-w-0 flex-1 items-center gap-2 rounded-ui px-2 py-1.5 text-left hover:bg-paper-2 active:bg-paper-3"
          onClick={onMenu}
          aria-label={`Board: ${boardName}. Open menu`}
        >
          {/* a pin head, the app's mark (one of the few circles) */}
          <span className="h-3 w-3 shrink-0 rounded-full bg-thread shadow-paper" aria-hidden />
          <span className="truncate text-base font-bold leading-tight">{boardName}</span>
        </button>
        <button className={`${iconBtn} ${searchOpen ? "bg-paper-3" : ""}`} onClick={onSearch} aria-label="Search the board" aria-expanded={searchOpen}>
          <Icon name="search" />
        </button>
        <button className={primaryBtn} onClick={onAdd} aria-label="Add to the board">
          <Icon name="plus" className="h-5 w-5" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>
    </div>
  );
}
