"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { BusinessInquiryViewModel } from "@/contracts";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";
import { TbdMark } from "../components/Tbd";

/**
 * Business Inquiries, ported from the current site's BusinessInquirySection
 * (W1-D09, WORKING_BASELINE). Same markup and classes; copy comes from the
 * view model. Preview only: submits to a mock, nothing is sent. The current
 * site's form posts to `/api/business-inquiry` (wiring v1 to it is TBD).
 */
type Status = "idle" | "sending" | "success" | "error";

const inputClass =
  "border border-navy/15 bg-cream px-4 py-3 text-sm text-navy placeholder:text-navy/35 focus:border-navy/40 focus:outline-none";
const labelClass = "flex flex-col gap-2 text-xs tracking-[0.1em] text-navy/70";

const previewSubmit = () => new Promise<void>((resolve) => setTimeout(resolve, 600));

export function BusinessInquiryView({ vm }: { vm: BusinessInquiryViewModel }) {
  const [status, setStatus] = useState<Status>("idle");
  const { copy, noteLinkHref, homeHref } = vm.content;

  if (copy.status === "TBD") {
    return (
      <div className="bg-cream py-[60px] md:py-[100px]">
        <Container className="max-w-2xl">
          <TbdMark slot="Business Inquiries" note={copy.note} tone="light" />
        </Container>
      </div>
    );
  }
  const t = copy.value;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");
    try {
      await previewSubmit();
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div lang="ja" className="flex min-h-[70vh] items-center bg-cream py-20 text-navy">
        <Container className="max-w-lg text-center">
          <FadeIn>
            <CheckCircle2 className="mx-auto h-14 w-14 text-red" strokeWidth={1.5} />
            <h1 className="mt-6 font-heading-jp text-3xl text-navy md:text-4xl">{t.successHeading}</h1>
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-navy/70">{t.success}</p>
            <p className="mt-4 text-xs text-navy/50">Preview only: this form uses a mock handler. Nothing is sent or stored.</p>
            <Link
              href={homeHref}
              className="mt-10 inline-block border border-gold bg-red px-8 py-4 text-sm tracking-[0.08em] text-cream transition-colors hover:bg-red-hover"
            >
              {t.backToTop}
            </Link>
          </FadeIn>
        </Container>
      </div>
    );
  }

  return (
    <div lang="ja" className="bg-cream py-[60px] text-navy md:py-[100px]">
      <Container className="max-w-2xl">
        <FadeIn className="text-center">
          <p className="text-xs tracking-[0.2em] text-red">{t.eyebrow}</p>
          <h1 className="mt-3 font-heading-jp text-3xl text-navy md:text-4xl">{t.heading}</h1>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-navy/70">{t.description}</p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <form onSubmit={handleSubmit} className="mt-12 flex flex-col gap-5 border border-navy/15 bg-white p-6 shadow-sm md:p-10">
            <label className={labelClass}>
              {t.companyLabel}
              <input type="text" name="company" required placeholder={t.companyPlaceholder} className={inputClass} />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>
                {t.contactNameLabel}
                <input type="text" name="contactName" required placeholder={t.contactNamePlaceholder} className={inputClass} />
              </label>
              <label className={labelClass}>
                {t.emailLabel}
                <input type="email" name="email" required placeholder={t.emailPlaceholder} className={inputClass} />
              </label>
            </div>

            <label className={labelClass}>
              {t.typeLabel}
              <select name="type" required defaultValue="" className={inputClass}>
                <option value="" disabled>
                  {t.typeLabel}
                </option>
                {t.typeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              {t.messageLabel}
              <textarea name="message" required rows={5} placeholder={t.messagePlaceholder} className={`resize-none ${inputClass}`} />
            </label>

            <p className="text-xs leading-relaxed text-navy/50">
              {t.note}{" "}
              <Link href={noteLinkHref} className="text-red underline hover:text-navy">
                {t.noteLink}
              </Link>
            </p>

            <button
              type="submit"
              disabled={status === "sending"}
              className="border border-gold bg-red px-8 py-4 text-sm tracking-[0.08em] text-cream transition-colors hover:bg-red-hover disabled:opacity-60"
            >
              {status === "sending" ? t.sending : t.submit}
            </button>

            {status === "error" ? <p className="text-sm text-red">{t.error}</p> : null}
            <p className="text-center text-[11px] text-navy/40">Preview only: submissions are not sent.</p>
          </form>
        </FadeIn>
      </Container>
    </div>
  );
}
