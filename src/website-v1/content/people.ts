import type { Person } from "@/contracts";
import { tbd } from "./shared";

/**
 * Guide slots. Real guides only (WD-003); who, photos and profiles are TBD,
 * so every slot is empty. Never fill these with invented people.
 */
export function getGuideSlots(): Person[] {
  return ["guide-slot-1", "guide-slot-2", "guide-slot-3"].map((id) => ({
    id,
    name: tbd("Real guide name TBD"),
    role: tbd("Role TBD"),
    photo: tbd("Real guide photo TBD"),
    bio: tbd("Profile TBD"),
  }));
}
