import { CustomCursor } from "./CustomCursor";
import { GridOverlay } from "./GridOverlay";
import { HeaderMotion } from "./HeaderMotion";
import { Interactions } from "./Interactions";
import { PageMotion } from "./PageMotion";
import { SmoothScroll } from "./SmoothScroll";

/**
 * The White Desert–style motion layer for every Website V1 page (Human
 * instruction 2026-11-15). One line in src/app/v1/layout.tsx; remove it (and
 * the wd.css import) to switch everything off. Page-specific scenes (Home Hero
 * mosaic, mist, fixed banner) live in HomeView.
 */
export function WdMotion() {
  return (
    <>
      <SmoothScroll />
      <HeaderMotion />
      <PageMotion />
      <GridOverlay />
      <CustomCursor />
      <Interactions />
    </>
  );
}
