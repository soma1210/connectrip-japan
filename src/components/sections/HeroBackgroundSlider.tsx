"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

const SLIDE_DURATION_MS = 5000;
const TRANSITION_SECONDS = 2.2;

const OBJECT_POSITIONS: Record<string, string> = {
  "/images/hero/slides/11-kyoto-sunset-pagoda.jpg": "85% 35%",
};

export function HeroBackgroundSlider({
  images,
  alts,
}: {
  images: string[];
  alts: string[];
}) {
  const [order] = useState(() => {
    const indices = images.map((_, i) => i);
    if (indices.length <= 2) return indices;
    const rest = indices.slice(1);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    return [indices[0], ...rest];
  });
  const [position, setPosition] = useState(0);

  useEffect(() => {
    if (order.length <= 1) return;
    const id = setInterval(() => {
      setPosition((current) => (current + 1) % order.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(id);
  }, [order.length]);

  const index = order[position] ?? 0;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={images[index]}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.12, y: 36 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05, y: -24 }}
          transition={{ duration: TRANSITION_SECONDS, ease: [0.22, 1, 0.36, 1] }}
        >
          <PlaceholderImage
            src={images[index]}
            alt={alts[index] ?? ""}
            sizes="100vw"
            priority={index === 0}
            objectPosition={OBJECT_POSITIONS[images[index]]}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
