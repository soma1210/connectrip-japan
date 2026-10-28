import type { PrivateDayPlannerViewModel } from "@/contracts";
import { Container } from "@/components/ui/Container";
import { PrivateDayPlannerForm } from "../components/planner/PrivateDayPlannerForm";
import { TbdText, textOr } from "../components/Tbd";
import { AREA_LABELS } from "../content/privateGuide";

const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function guestsLabel(adults: number, children: number) {
  const parts = [`${adults} ${adults === 1 ? "Adult" : "Adults"}`];
  if (children > 0) parts.push(`${children} ${children === 1 ? "Child" : "Children"}`);
  return parts.join(" · ");
}

/**
 * Private Day Planner v1 (PROTOTYPE / PENDING HUMAN VISUAL REVIEW): preferences
 * after a Private Guide booking. Booking details are shown read-only (never
 * asked again); the form collects the planning answers (no Interests).
 */
export function PrivateDayPlannerView({ vm }: { vm: PrivateDayPlannerViewModel }) {
  const c = vm.content;
  const b = c.booking;
  const details = [
    { label: "Date", value: longDate.format(new Date(`${b.travelDate}T00:00:00Z`)) },
    { label: "Area", value: b.areas.map((a) => textOr(AREA_LABELS[a], a)).join(", ") },
    { label: "Guests", value: guestsLabel(b.adults, b.children) },
    { label: "Customer", value: b.customerName },
  ];

  return (
    <section className="bg-navy pt-12 pb-16 md:pt-20 md:pb-24">
      <Container>
        <header className="max-w-3xl">
          <TbdText value={c.eyebrow} slot="Eyebrow" as="p" className="font-heading-en text-xs tracking-[0.3em] text-gold" />
          <TbdText value={c.heading} slot="Heading" as="h1" className="mt-4 font-heading-jp text-4xl leading-tight text-cream md:text-6xl" />
          <TbdText value={c.supporting} slot="Supporting copy" as="p" className="mt-5 max-w-2xl text-sm leading-relaxed text-cream/75 md:text-base" />
        </header>

        <section aria-labelledby="planner-booking" className="mt-10 border border-gold/30 bg-navy-dark px-5 py-6 md:mt-14 md:px-8 md:py-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="planner-booking" className="font-heading-en text-xs tracking-[0.25em] text-gold/80">
              BOOKING DETAILS
            </h2>
            {b.demo ? (
              <span className="border border-dashed border-gold/60 px-2 py-0.5 text-[10px] tracking-[0.15em] text-gold/80">DEMO BOOKING · PROTOTYPE</span>
            ) : null}
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
            {details.map((d) => (
              <div key={d.label} className="min-w-0">
                <dt className="text-[11px] tracking-[0.15em] text-cream/50 uppercase">{d.label}</dt>
                <dd className="mt-1.5 break-words text-base text-cream">{d.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs leading-relaxed text-cream/45">These come from your booking, so there is no need to enter them again.</p>
        </section>

        <div className="mt-12 md:mt-16">
          <PrivateDayPlannerForm content={c} />
        </div>
      </Container>
    </section>
  );
}
