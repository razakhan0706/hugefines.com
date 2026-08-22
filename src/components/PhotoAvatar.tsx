import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  url?: string | null;
  name?: string | null;
  className?: string;
  busy?: boolean;
  onPick?: (file: File) => void;
  title?: string;
  /** Short text shown next to the avatar when it is an upload target and empty. */
  label?: string;
  /** Show the label even when a photo already exists (e.g. "Change photo"). */
  labelAlways?: boolean;
}

/** Round avatar that optionally doubles as a photo upload button. */
export function PhotoAvatar({ url, name, className, busy, onPick, title, label }: Props) {
  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";

  const inner = (
    <>
      {url ? (
        <img
          src={url}
          alt={name ?? "Photo"}
          className={cn("size-11 rounded-full object-cover", className)}
        />
      ) : (
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-full bg-secondary text-sm font-bold text-muted-foreground",
            onPick && "border-2 border-dashed border-accent/70 bg-accent/5 text-accent-strong",
            className,
          )}
        >
          {initial === "?" && onPick ? <Camera className="size-4" /> : initial}
        </span>
      )}
      {onPick && !url && !busy && (
        <span className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-accent text-accent-foreground ring-2 ring-background">
          <Camera className="size-2.5" />
        </span>
      )}
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
          <Loader2 className="size-4 animate-spin" />
        </span>
      )}
    </>
  );

  if (!onPick) return <span className="relative inline-block shrink-0">{inner}</span>;

  return (
    <label
      className="relative inline-flex shrink-0 cursor-pointer items-center gap-2"
      title={title ?? "Upload photo"}
    >
      <span className="relative inline-block shrink-0">{inner}</span>
      {label && !url && (
        <span className="whitespace-nowrap text-xs font-medium text-accent-strong underline">
          {label}
        </span>
      )}
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}
