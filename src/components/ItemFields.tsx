import { safeUrl } from "@/lib/model";
import { useOnline } from "@/lib/online";
import type { FieldDef, FieldValue, Item, ItemType } from "@/lib/types";
import { btn, field, select } from "./cardStyles";

/** "Open" button for a web link, with a hint when there is no signal. Never opens anything but http(s) links. */
function OpenLink({ url }: { url: string | undefined }) {
  const online = useOnline();
  const href = safeUrl(url);
  if (!href) return (url ?? "").trim() ? <span className="text-xs text-red-700">not a web link</span> : null;
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <a href={href} target="_blank" rel="noopener noreferrer" className={btn}>
        Open ↗
      </a>
      {!online && <span className="text-xs text-stone-600">needs signal</span>}
    </span>
  );
}

function FieldInput({ def, value, onChange }: { def: FieldDef; value: FieldValue | undefined; onChange: (v: FieldValue) => void }) {
  const text = typeof value === "string" || typeof value === "number" ? String(value) : "";
  switch (def.type) {
    case "longtext":
      return <textarea value={text} onChange={(e) => onChange(e.target.value)} rows={2} className={`${field} resize-none text-sm`} />;
    case "number":
      return (
        <input
          type="number"
          inputMode="decimal"
          value={text}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          className={`${field} text-sm`}
        />
      );
    case "checkbox":
      return <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-stone-800" />;
    case "select":
      return (
        <select value={text} onChange={(e) => onChange(e.target.value)} className={select}>
          <option value="">—</option>
          {(def.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "link":
      return (
        <div className="flex items-center gap-2">
          <input value={text} onChange={(e) => onChange(e.target.value)} placeholder="https://…" className={`${field} min-w-0 text-sm`} />
          <OpenLink url={text} />
        </div>
      );
    default:
      return <input value={text} onChange={(e) => onChange(e.target.value)} className={`${field} text-sm`} />;
  }
}

interface Props {
  item: Item;
  types: ItemType[];
  onPatch: (patch: Partial<Item>) => void;
}

/** The type picker, the type's own fields, and the link every item can carry. */
export default function ItemFields({ item, types, onPatch }: Props) {
  const type = item.typeId ? types.find((t) => t.id === item.typeId) : undefined;
  const eligible = item.kind === "note" || item.kind === "section";

  return (
    <div className="mb-3 space-y-2">
      {eligible && types.length > 0 && (
        <label className="flex items-center gap-2 text-sm">
          <span className="text-stone-600">Type</span>
          <select
            value={type?.id ?? ""}
            onChange={(e) => onPatch({ typeId: e.target.value || undefined })}
            className={select}
          >
            <option value="">(none)</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {type?.fields.map((def) => (
        <div key={def.id} className="text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-stone-600">{def.name}</div>
          <FieldInput
            def={def}
            value={item.fields?.[def.id]}
            onChange={(v) => onPatch({ fields: { ...item.fields, [def.id]: v } })}
          />
        </div>
      ))}

      <div className="text-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-stone-600">Link</div>
        <div className="flex items-center gap-2">
          <input
            value={item.url ?? ""}
            onChange={(e) => onPatch({ url: e.target.value || undefined })}
            placeholder="https://… (e.g. a YouTube video)"
            className={`${field} min-w-0 text-sm`}
          />
          <OpenLink url={item.url} />
        </div>
      </div>
    </div>
  );
}
