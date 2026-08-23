"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "none";
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: direction === "up" ? 16 : 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
