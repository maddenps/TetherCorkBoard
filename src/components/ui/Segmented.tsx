import { Icon, type IconName } from "./icons";

interface Props<T extends string> {
  value: T;
  options: { value: T; label: string; icon?: IconName }[];
  onChange: (value: T) => void;
  label: string;
}

/** A choice between a few options (theme, board surface). The chosen one sits raised on paper. */
export default function Segmented<T extends string>({ value, options, onChange, label }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-ui bg-paper-3 p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`chrome-focus flex min-h-10 flex-1 items-center justify-center gap-2 rounded-ui-sm px-3 text-sm font-semibold transition ${
              on ? "bg-paper text-ink shadow-paper" : "text-ink-soft hover:text-ink"
            }`}
          >
            {o.icon && <Icon name={o.icon} className="h-4 w-4" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
