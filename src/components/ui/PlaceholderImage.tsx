"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

export function PlaceholderImage({
  src,
  alt,
  sizes,
  className,
  priority,
}: {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className="absolute inset-0 border border-dashed border-gold/30 bg-navy-light">
        <div className="absolute bottom-2 right-2 flex max-w-[70%] items-center gap-1.5 bg-navy-dark/70 px-2 py-1">
          <ImageOff className="h-3.5 w-3.5 shrink-0 text-gold/60" aria-hidden />
          <span className="truncate text-[10px] leading-none text-gold/60">
            {src}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes ?? "100vw"}
      priority={priority}
      className={cn("object-cover", className)}
      onError={() => setErrored(true)}
    />
  );
}
