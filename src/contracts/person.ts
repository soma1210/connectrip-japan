import type { ImageAsset } from "./media";
import type { Tbd } from "./status";

/**
 * A real guide / operator (WD-003). Who, how many, photos, titles and bios
 * are TBD. Never fill these with invented people or credentials.
 */
export type Person = {
  id: string;
  name: Tbd<string>;
  role: Tbd<string>;
  photo: Tbd<ImageAsset>;
  /** Detailed profile, shown on About only. */
  bio?: Tbd<string>;
};

/** Home shows face + name + minimal presence only (WD-003). */
export type PersonPreview = Pick<Person, "id" | "name" | "role" | "photo">;
