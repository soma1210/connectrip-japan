"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";
import { Link } from "@/i18n/navigation";

type Status = "idle" | "sending" | "success" | "error";

const inputClass =
  "border border-navy/15 bg-cream px-4 py-3 text-sm text-navy placeholder:text-navy/35 focus:border-navy/40 focus:outline-none";
const labelClass = "flex flex-col gap-2 text-xs tracking-[0.1em] text-navy/70";

export function BusinessInquirySection() {
  const t = useTranslations("businessInquiry");
  const tf = useTranslations("businessInquiry.form");
  const typeOptions = tf.raw("typeOptions") as string[];
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus("sending");
    try {
      const response = await fetch("/api/business-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: formData.get("company"),
          contactName: formData.get("contactName"),
          email: formData.get("email"),
          type: formData.get("type"),
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
    <div className="bg-cream py-[60px] text-navy md:py-[100px]">
      <Container className="max-w-2xl">
        <FadeIn className="text-center">
          <p className="text-xs tracking-[0.2em] text-red">{t("eyebrow")}</p>
          <h1 className="mt-3 font-heading-jp text-3xl text-navy md:text-4xl">
            {t("heading")}
          </h1>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-navy/70">
            {t("description")}
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <form
            onSubmit={handleSubmit}
            className="mt-12 flex flex-col gap-5 border border-navy/15 bg-white p-6 shadow-sm md:p-10"
          >
            <label className={labelClass}>
              {tf("companyLabel")}
              <input
                type="text"
                name="company"
                required
                placeholder={tf("companyPlaceholder")}
                className={inputClass}
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>
                {tf("contactNameLabel")}
                <input
                  type="text"
                  name="contactName"
                  required
                  placeholder={tf("contactNamePlaceholder")}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                {tf("emailLabel")}
                <input
                  type="email"
                  name="email"
                  required
                  placeholder={tf("emailPlaceholder")}
                  className={inputClass}
                />
              </label>
            </div>

            <label className={labelClass}>
              {tf("typeLabel")}
              <select name="type" required defaultValue="" className={inputClass}>
                <option value="" disabled>
                  {tf("typeLabel")}
                </option>
                {typeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              {tf("messageLabel")}
              <textarea
                name="message"
                required
                rows={5}
                placeholder={tf("messagePlaceholder")}
                className={`resize-none ${inputClass}`}
              />
            </label>

            <p className="text-xs leading-relaxed text-navy/50">
              {tf("note")}{" "}
              <Link href="/reservation" className="text-red underline hover:text-navy">
                {tf("noteLink")}
              </Link>
            </p>

            <button
              type="submit"
              disabled={status === "sending"}
              className="border border-gold bg-red px-8 py-4 text-sm tracking-[0.08em] text-cream transition-colors hover:bg-red-hover disabled:opacity-60"
            >
              {status === "sending" ? tf("sending") : tf("submit")}
            </button>

            {status === "success" ? (
              <p className="text-sm text-navy">{tf("success")}</p>
            ) : null}
            {status === "error" ? (
              <p className="text-sm text-red">{tf("error")}</p>
            ) : null}
          </form>
        </FadeIn>
      </Container>
    </div>
  );
}
