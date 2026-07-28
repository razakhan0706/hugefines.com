import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  url?: string | null;
  name?: string | null;
  className?: string;
  busy?: boolean;
  onPick?: (file: File) => void;
  title?: string;
}

/** Round avatar that optionally doubles as a photo upload button. */
export function PhotoAvatar({ url, name, className, busy, onPick, title }: Props) {
  const inner = (
    <>
      {url ? (
        <img
          src={url}
          alt={name ?? "Photo"}
          className={cn("size-10 rounded-full object-cover", className)}
        />
      ) : (
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground",
            className,
          )}
        >
          {onPick ? (
            <Camera className="size-4" />
          ) : (
            <span className="text-sm font-bold">{(name ?? "?").charAt(0).toUpperCase()}</span>
          )}
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
    <label className="relative inline-block shrink-0 cursor-pointer" title={title ?? "Upload photo"}>
      {inner}
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
