"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";

type Status = "idle" | "sending" | "success" | "error";

export function ContactSection() {
  const t = useTranslations("contact");
  const infoRows = t.raw("infoRows") as { label: string; value: string }[];
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
        }),
      });

      if (!response.ok) throw new Error("Request failed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="bg-navy py-12 md:py-20">
      <Container>
        <SectionHeading heading={t("heading")} />
        <p className="-mt-8 mb-10 max-w-2xl text-sm leading-relaxed text-cream/75 md:mb-14">
          {t("description")}
        </p>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col divide-y divide-cream/10 border-t border-cream/10">
            {infoRows.map((row) => (
              <div key={row.label} className="grid gap-1 py-5 sm:grid-cols-[160px_1fr] sm:gap-4">
                <span className="font-heading-en text-xs tracking-[0.1em] text-gold">
                  {row.label}
                </span>
                <span className="whitespace-pre-line text-sm text-cream/80">{row.value}</span>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 border border-gold/30 p-6 md:p-8"
          >
            <label className="flex flex-col gap-2 text-xs tracking-[0.1em] text-cream/70">
              {t("form.nameLabel")}
              <input
                type="text"
                name="name"
                required
                placeholder={t("form.namePlaceholder")}
                className="border border-cream/20 bg-navy-light px-4 py-3 text-sm text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-2 text-xs tracking-[0.1em] text-cream/70">
              {t("form.emailLabel")}
              <input
                type="email"
                name="email"
                required
                placeholder={t("form.emailPlaceholder")}
                className="border border-cream/20 bg-navy-light px-4 py-3 text-sm text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-2 text-xs tracking-[0.1em] text-cream/70">
              {t("form.messageLabel")}
              <textarea
                name="message"
                required
                rows={5}
                placeholder={t("form.messagePlaceholder")}
                className="resize-none border border-cream/20 bg-navy-light px-4 py-3 text-sm text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={status === "sending"}
              className="border border-gold bg-red px-8 py-4 text-sm tracking-[0.08em] text-cream transition-colors hover:bg-red-hover disabled:opacity-60"
            >
              {status === "sending" ? t("form.sending") : t("form.submit")}
            </button>

            {status === "success" ? (
              <p className="text-sm text-gold">{t("form.success")}</p>
            ) : null}
            {status === "error" ? (
              <p className="text-sm text-red">{t("form.error")}</p>
            ) : null}
          </form>
        </div>
      </Container>
    </section>
  );
}
