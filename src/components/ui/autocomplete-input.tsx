import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export interface AutocompleteInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onValueChange: (value: string) => void;
  suggestions: string[];
  maxItems?: number;
}

export function AutocompleteInput({
  value,
  onValueChange,
  suggestions,
  maxItems = 6,
  className,
  onKeyDown,
  onBlur,
  onFocus,
  ...props
}: AutocompleteInputProps) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [dismissed, setDismissed] = React.useState(false);

  const q = norm(value);
  const matches = React.useMemo(() => {
    if (!q) return [];
    const starts: string[] = [];
    const contains: string[] = [];
    for (const s of suggestions) {
      const n = norm(s);
      if (!n || n === q) continue;
      if (n.startsWith(q)) starts.push(s);
      else if (n.includes(q)) contains.push(s);
    }
    return [...starts, ...contains].slice(0, maxItems);
  }, [q, suggestions, maxItems]);

  const visible = open && !dismissed && matches.length > 0;
  const top = matches[active] ?? matches[0];
  const ghost =
    visible && top && norm(top).startsWith(q) && top.length > value.length
      ? value + top.slice(value.length)
      : null;

  const exactExists = suggestions.some((s) => norm(s) === q);
  const nearMatch =
    !exactExists && q.length > 2
      ? suggestions.find((s) => norm(s).startsWith(q) || q.startsWith(norm(s)))
      : undefined;

  function accept(v: string) {
    onValueChange(v);
    setOpen(false);
    setDismissed(true);
    setActive(0);
  }

  return (
    <div className="relative">
      {ghost && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center overflow-hidden truncate rounded-md px-3 py-1 text-base md:text-sm"
        >
          <span className="invisible whitespace-pre">{value}</span>
          <span className="whitespace-pre text-muted-foreground/60">
            {ghost.slice(value.length)}
          </span>
        </div>
      )}
      <Input
        {...props}
        value={value}
        className={cn("relative bg-transparent", className)}
        autoComplete="off"
        onChange={(e) => {
          onValueChange(e.target.value);
          setDismissed(false);
          setOpen(true);
          setActive(0);
        }}
        onFocus={(e) => {
          setOpen(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          window.setTimeout(() => setOpen(false), 120);
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          if (visible) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => (i + 1) % matches.length);
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => (i - 1 + matches.length) % matches.length);
              return;
            }
            if (e.key === "Tab" || e.key === "Enter") {
              if (top) {
                e.preventDefault();
                accept(top);
                return;
              }
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setDismissed(true);
              setOpen(false);
              return;
            }
          }
          onKeyDown?.(e);
        }}
      />
      {visible && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
          {matches.map((m, i) => (
            <li key={m}>
              <button
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left text-sm",
                  i === active ? "bg-accent/10 font-medium" : "hover:bg-muted",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => accept(m)}
              >
                {m}
              </button>
            </li>
          ))}
        </ul>
      )}
      {!visible && nearMatch && (
        <button
          type="button"
          className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => accept(nearMatch)}
        >
          Did you mean <span className="font-medium text-foreground">{nearMatch}</span>?
        </button>
      )}
    </div>
  );
}
