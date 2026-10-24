import type { ConnectripSelectViewModel } from "@/contracts";
import { Section, SectionTitle } from "../components/Blocks";
import { SelectMap } from "../components/select/SelectMap";
import { TbdText } from "../components/Tbd";

/**
 * Connectrip Select (W1-D17): a Website v1 content page, not a separate app.
 * Site Header / Footer come from the v1 layout; the heading, spacing and
 * colours are the site's own (Section, SectionTitle, navy / gold / cream).
 * Below the heading sits the illustrated Osaka map. No sidebars.
 */
export function ConnectripSelectView({ vm }: { vm: ConnectripSelectViewModel }) {
  const c = vm.content;
  return (
    <Section className="pt-6! md:pt-10!">
      <TbdText value={c.eyebrow} slot="Eyebrow" as="p" className="ml-6 font-heading-en text-xs tracking-[0.3em] text-gold/80 md:ml-10" />
      <SectionTitle heading={c.heading} supporting={c.description} slot="Connectrip Select" as="h1" />
      <SelectMap content={c} />
      {c.note ? <TbdText value={c.note} slot="Map note" as="p" className="mt-8 text-sm text-cream/55" /> : null}
    </Section>
  );
}
