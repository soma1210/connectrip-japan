"use client";

import { motion } from "motion/react";
import { GalleryCard } from "@/components/cards/GalleryCard";

export function GalleryMarquee({
  items,
}: {
  items: { image: string; imageAlt: string }[];
}) {
  const durationSeconds = items.length * 4;

  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex w-max gap-4"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: durationSeconds, ease: "linear", repeat: Infinity }}
      >
        {[...items, ...items].map((item, index) => (
          <GalleryCard key={`${item.image}-${index}`} image={item.image} imageAlt={item.imageAlt} />
        ))}
      </motion.div>
    </div>
  );
}
