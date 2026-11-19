import type { PersonPreview } from "../person";
import { proposed, tbd } from "../status";
import { FIXTURE_SOURCE, fixtureImage, fixtureText } from "./shared";

/** Placeholder people. Real guides / operators are TBD (WD-003). */
export const peopleFixture: PersonPreview[] = [
  {
    id: "fixture-person-a",
    name: fixtureText("Guide A"),
    role: fixtureText("Role"),
    photo: proposed(fixtureImage(480, 480, "Portrait placeholder"), FIXTURE_SOURCE),
  },
  {
    id: "fixture-person-b",
    name: fixtureText("Guide B"),
    role: tbd("Role not decided"),
    photo: tbd("Photo not available (TRUST ASSET NEEDED)"),
  },
];
