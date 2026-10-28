import Link from "next/link";
import type { PrivateGuideBookingPageViewModel } from "@/contracts";
import { PageIntro, Section } from "../components/Blocks";
import { PrivateGuideBooking } from "../components/booking/PrivateGuideBooking";
import { TbdText } from "../components/Tbd";

/**
 * Private Guide booking page — Unified Booking Flow v1 (PROTOTYPE / PENDING
 * HUMAN VISUAL REVIEW). Reached from the Private Guide page's "Book a Private
 * Guide". Questions before booking go to Inquiry instead.
 */
export function PrivateGuideBookingView({ vm }: { vm: PrivateGuideBookingPageViewModel }) {
  const c = vm.content;
  return (
    <>
      <PageIntro headline={c.intro.headline} supporting={c.intro.supporting} slot="Book a Private Guide" />
      <Section id="book" className="pt-6! md:pt-10!">
        <p className="mb-8 text-sm">
          <Link href={c.backCta.href} className="text-cream/65 underline decoration-gold/30 underline-offset-4 hover:text-gold">
            ← <TbdText value={c.backCta.label} slot="Back CTA" />
          </Link>
        </p>
        <PrivateGuideBooking model={c.booking} details={c.details} paymentNotice={c.paymentNotice} />
      </Section>
    </>
  );
}
