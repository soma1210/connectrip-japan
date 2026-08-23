"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

const SLIDE_DURATION_MS = 5000;
const TRANSITION_SECONDS = 1.5;

export function HeroBackgroundSlider({
  images,
  alts,
}: {
  images: string[];
  alts: string[];
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={images[index]}
          className="absolute inset-0"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: TRANSITION_SECONDS, ease: [0.22, 1, 0.36, 1] }}
        >
          <PlaceholderImage
            src={images[index]}
            alt={alts[index] ?? ""}
            sizes="100vw"
            priority={index === 0}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
