"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, X } from "lucide-react";
import { toast } from "sonner";
import { ProductImage } from "@/components/ui/product-image";
import { Spinner } from "@/components/ui/misc";

/** Upload images to /api/upload or paste image URLs. First image = cover. */
export function ImageUploader({
  value,
  onChange,
  max = 10,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState("");

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const body = new FormData();
    Array.from(files)
      .slice(0, max - value.length)
      .forEach((f) => body.append("files", f));
    setUploading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onChange([...value, ...json.urls]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {value.map((src, i) => (
          <div key={src + i} className="group relative aspect-[3/4] overflow-hidden rounded border border-line bg-soft">
            <ProductImage src={src} alt="" fill sizes="120px" />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-foreground px-1.5 py-0.5 text-[10px] text-white">Cover</span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 opacity-0 transition group-hover:opacity-100">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 text-white disabled:opacity-30" aria-label="Move left">
                <ArrowLeft className="size-3.5" />
              </button>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="p-1 text-white" aria-label="Remove">
                <X className="size-3.5" />
              </button>
              <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="p-1 text-white disabled:opacity-30" aria-label="Move right">
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded border border-dashed border-line text-xs text-muted hover:border-foreground hover:text-foreground"
          >
            {uploading ? <Spinner className="size-5" /> : <ImagePlus className="size-5" />}
            {uploading ? "Uploading" : "Upload"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(e) => upload(e.target.files)}
      />
      <div className="mt-3 flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded border border-line px-2">
          <Link2 className="size-4 text-muted" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="…or paste an image URL (https://)"
            className="flex-1 bg-transparent py-2 text-sm outline-none"
          />
        </div>
        <button
          type="button"
          className="rounded border border-line px-3 text-sm hover:border-foreground"
          onClick={() => {
            const u = url.trim();
            if (!/^https:\/\/\S+$/.test(u)) return toast.error("Enter a valid https:// URL");
            onChange([...value, u]);
            setUrl("");
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
