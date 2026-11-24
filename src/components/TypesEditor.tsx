"use client";

import { useRef, useState } from "react";
import { PAPER_COLORS } from "@/lib/board";
import { FIELD_TYPES, defaultTypes, newField, newType } from "@/lib/model";
import { BUILT_IN_PACKS, makePack, mergePack, parsePack, type Pack } from "@/lib/packs";
import type { FieldDef, FieldType, ItemType } from "@/lib/types";
import { useEscape } from "./ui/useEscape";
import Fastener from "./ui/Fastener";
import Folded from "./ui/Folded";
import { useVisit } from "@/lib/fasteners";

interface Props {
  types: ItemType[];
  onChange: (types: ItemType[]) => void;
  onClose: () => void;
}

const input =
  "chrome-focus w-full rounded-ui border border-line bg-paper-2 px-2.5 py-2 text-sm text-ink placeholder:text-ink-faint";
const smallBtn =
  "chrome-focus inline-flex min-h-10 shrink-0 items-center justify-center rounded-ui border border-line bg-paper px-3.5 text-sm font-semibold text-ink hover:bg-paper-2 active:bg-paper-3 disabled:opacity-40";

/**
 * Design the item types for this board: a name, whether it is a note or a section, a paper colour, and any
 * number of fields (text, number, link, checkbox, choice). Changes apply to the board straight away.
 */
export default function TypesEditor({ types, onChange, onClose }: Props) {
  useEscape(true, onClose);
  const visit = useVisit();
  const [selectedId, setSelectedId] = useState<string | null>(types[0]?.id ?? null);
  const current = types.find((t) => t.id === selectedId) ?? null;
  const packFile = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  /** Add a pack's types to this board; types the board already has are left alone. */
  function addPack(pack: Pack) {
    const { types: next, added, skipped } = mergePack(types, pack);
    onChange(next);
    if (added > 0) setSelectedId(next[types.length]?.id ?? selectedId);
    setMessage(
      added === 0
        ? `"${pack.name}": this board already has all of its types.`
        : `Added ${added} type${added === 1 ? "" : "s"} from "${pack.name}"${skipped ? ` (${skipped} already here)` : ""}.`,
    );
  }

  async function loadPackFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const pack = parsePack(JSON.parse(await file.text()));
      if (!pack) throw new Error("not a pack");
      addPack(pack);
    } catch {
      setMessage("That file is not a Tether type pack.");
    }
  }

  function savePackFile() {
    const name = prompt("Name for this pack?", "My types");
    if (!name) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(makePack(name, types), null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[^\w-]+/g, "_") || "types"}.cork-pack.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const patchType = (patch: Partial<ItemType>) => onChange(types.map((t) => (t.id === selectedId ? { ...t, ...patch } : t)));
  const patchField = (id: string, patch: Partial<FieldDef>) =>
    current && patchType({ fields: current.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)) });

  function addType() {
    const t = newType();
    onChange([...types, t]);
    setSelectedId(t.id);
  }

  function deleteType() {
    if (!current) return;
    if (!confirm(`Delete the type "${current.name}"? Items made from it stay, but stop showing its fields.`)) return;
    const rest = types.filter((t) => t.id !== current.id);
    onChange(rest);
    setSelectedId(rest[0]?.id ?? null);
  }

  function moveField(index: number, dir: -1 | 1) {
    if (!current) return;
    const next = [...current.fields];
    const to = index + dir;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    patchType({ fields: next });
  }

  return (
    <div data-modal className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 sm:items-center sm:p-3" role="dialog" aria-label="Item types">
      <Folded
        className="relative w-full max-w-xl"
        style={{ maxHeight: "calc(100dvh - 1.5rem)" }}
        paperClassName="flex flex-col rounded-t-ui p-4 sm:rounded-ui"
        paperStyle={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)", maxHeight: "calc(100dvh - 1.5rem)" }}
        fasteners={
          <>
            <Fastener id="types" visit={visit} at="top-center" chance={0.7} />
            <Fastener id="types-corner" visit={visit} at="top-left" chance={0.35} kinds={["staple", "clip"]} />
          </>
        }
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">Item types and packs</h2>
          <button className={smallBtn} onClick={onClose}>
            Done
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          {types.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`rounded-ui border-2 px-3 py-1.5 text-sm font-semibold text-stone-900 ${t.id === selectedId ? "border-ink" : "border-transparent"}`}
              style={{ background: t.color }}
            >
              {t.name || "(unnamed)"}
            </button>
          ))}
          <button className={smallBtn} onClick={addType}>
            + New type
          </button>
          {types.length === 0 && (
            <button className={smallBtn} onClick={() => onChange(defaultTypes())}>
              Restore starter types
            </button>
          )}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Packs</span>
          {BUILT_IN_PACKS.map((p) => (
            <button key={p.name} className={smallBtn} onClick={() => addPack(p)} title={p.description}>
              + {p.name}
            </button>
          ))}
          <button className={smallBtn} onClick={() => packFile.current?.click()}>
            Load pack file…
          </button>
          <button className={smallBtn} onClick={savePackFile} disabled={types.length === 0}>
            Save these types as a pack
          </button>
          <input ref={packFile} type="file" accept=".json,application/json" className="hidden" onChange={loadPackFile} />
          {message && (
            <div className="w-full text-xs text-ink-soft" role="status">
              {message}
            </div>
          )}
        </div>

        {current ? (
          <div className="min-h-0 space-y-3 overflow-y-auto">
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-0 flex-1 text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Name</span>
                <input className={input} value={current.name} onChange={(e) => patchType({ name: e.target.value })} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Looks like</span>
                <select className={input} value={current.kind} onChange={(e) => patchType({ kind: e.target.value === "section" ? "section" : "note" })}>
                  <option value="note">Sticky note</option>
                  <option value="section">Section (holds other items)</option>
                </select>
              </label>
            </div>

            <div className="flex gap-2">
              {PAPER_COLORS.map((c) => (
                <button
                  key={c}
                  aria-label={`Colour ${c}`}
                  onClick={() => patchType({ color: c })}
                  className={`h-8 w-8 rounded-ui-sm border-2 ${current.color === c ? "border-ink" : "border-line"}`}
                  style={{ background: c }}
                />
              ))}
            </div>

            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Fields</div>
              {current.fields.length === 0 && <div className="py-2 text-sm text-ink-soft">No fields yet.</div>}
              {current.fields.map((f, i) => (
                <div key={f.id} className="mb-2 rounded-ui-sm bg-paper-2 p-2">
                  <div className="flex items-center gap-2">
                    <input className={input} value={f.name} onChange={(e) => patchField(f.id, { name: e.target.value })} aria-label="Field name" />
                    <select
                      className={`${input} w-auto`}
                      value={f.type}
                      onChange={(e) => {
                        const type = e.target.value as FieldType;
                        patchField(f.id, { type, options: type === "select" ? f.options ?? ["Option 1", "Option 2"] : undefined });
                      }}
                      aria-label="Field type"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <button className={smallBtn} onClick={() => moveField(i, -1)} aria-label="Move field up">
                      ↑
                    </button>
                    <button className={smallBtn} onClick={() => moveField(i, 1)} aria-label="Move field down">
                      ↓
                    </button>
                    <button className={`${smallBtn} text-thread`} onClick={() => patchType({ fields: current.fields.filter((x) => x.id !== f.id) })} aria-label="Delete field">
                      ✕
                    </button>
                  </div>
                  {f.type === "select" && (
                    <input
                      className={`${input} mt-2`}
                      value={(f.options ?? []).join(", ")}
                      onChange={(e) => patchField(f.id, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
                      placeholder="Choices, separated by commas"
                      aria-label="Choices"
                    />
                  )}
                </div>
              ))}
              <button className={smallBtn} onClick={() => patchType({ fields: [...current.fields, newField()] })}>
                + Add field
              </button>
            </div>

            <div className="pt-1">
              <button className={`${smallBtn} text-thread`} onClick={deleteType}>
                Delete this type
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 text-sm text-ink-soft">Pick a type to edit it, or make a new one.</div>
        )}
      </Folded>
    </div>
  );
}
