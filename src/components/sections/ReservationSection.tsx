"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronDown } from "lucide-react";
import { sendGTMEvent } from "@next/third-parties/google";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

type Status = "idle" | "sending" | "success" | "error";

const inputClass =
  "border border-cream/20 bg-navy-light px-4 py-3 text-sm text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none";
const labelClass = "flex flex-col gap-2 text-xs tracking-[0.1em] text-cream/70";

function CheckboxGroup({
  label,
  name,
  options,
  single = false,
}: {
  label: string;
  name: string;
  options: string[];
  /** When true, renders radio inputs so only one option can be selected. */
  single?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs tracking-[0.1em] text-cream/70">{label}</span>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 text-sm text-cream/85"
          >
            <input
              type={single ? "radio" : "checkbox"}
              name={name}
              value={option}
              className="h-4 w-4 border-cream/30 bg-navy-light accent-red"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

export function ReservationSection() {
  const t = useTranslations("reservation");
  const tf = useTranslations("reservation.form");
  const areas = tf.raw("areas") as string[];
  const services = tf.raw("services") as string[];
  const interests = tf.raw("interests") as string[];
  const budgetOptions = tf.raw("budgetOptions") as string[];
  const travelerCounts = tf.raw("travelerCounts") as string[];
  const [status, setStatus] = useState<Status>("idle");
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  // Set via a ref (not state) so the server-rendered markup never has to guess
  // the visitor's local date and can't mismatch it during hydration.
  useEffect(() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate(),
    ).padStart(2, "0")}`;
    if (startDateRef.current) startDateRef.current.min = today;
    if (endDateRef.current) endDateRef.current.min = today;
  }, []);

  // Keep the end date from ever landing before whichever start date was
  // just entered, in addition to never being before today.
  function handleStartDateChange() {
    const startValue = startDateRef.current?.value;
    const todayMin = startDateRef.current?.min ?? "";
    const endMin = startValue && startValue > todayMin ? startValue : todayMin;
    const end = endDateRef.current;
    if (!end) return;
    end.min = endMin;
    if (end.value && end.value < endMin) {
      end.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus("sending");
    try {
      const response = await fetch("/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          country: formData.get("country"),
          startDate: formData.get("startDate"),
          endDate: formData.get("endDate"),
          adults: formData.get("adults"),
          children: formData.get("children"),
          areas: formData.getAll("areas"),
          services: formData.getAll("services"),
          interests: formData.getAll("interests"),
          budget: formData.getAll("budget"),
          message: formData.get("message"),
        }),
      });

      if (!response.ok) throw new Error("Request failed");
      setStatus("success");
      sendGTMEvent({ event: "reservation_submit" });
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="bg-navy py-12 md:py-20">
      <Container>
        <SectionHeading
          heading={t("heading")}
          subheading={t("subheading")}
          className="mt-6 mb-0! md:mt-14 md:mb-0!"
          subheadingClassName="mt-6 text-xl text-cream/85 md:mt-8 md:text-3xl"
        />
        <FadeIn className="mt-6 mb-10 md:mt-8 md:mb-14">
          <p className="max-w-2xl text-sm leading-relaxed text-cream/75">
            {t("description")}
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="w-full">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-8 border border-gold/30 bg-navy-dark p-6 md:p-10"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>
                {tf("nameLabel")}
                <input
                  type="text"
                  name="name"
                  required
                  placeholder={tf("namePlaceholder")}
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
              {tf("countryLabel")}
              <input
                type="text"
                name="country"
                required
                placeholder={tf("countryPlaceholder")}
                className={inputClass}
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>
                {tf("startDateLabel")}
                <input
                  ref={startDateRef}
                  type="date"
                  name="startDate"
                  required
                  onChange={handleStartDateChange}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                {tf("endDateLabel")}
                <input
                  ref={endDateRef}
                  type="date"
                  name="endDate"
                  required
                  className={inputClass}
                />
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs tracking-[0.1em] text-cream/70">
                {tf("travelersLabel")}
              </span>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>
                  {tf("adultsLabel")}
                  <div className="relative">
                    <select
                      name="adults"
                      required
                      defaultValue=""
                      className={cn(inputClass, "w-full appearance-none pr-10")}
                    >
                      <option value="" disabled>
                        {tf("travelersPlaceholder")}
                      </option>
                      {travelerCounts.map((count) => (
                        <option key={count} value={count}>
                          {count}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/50" />
                  </div>
                </label>
                <label className={labelClass}>
                  {tf("childrenLabel")}
                  <div className="relative">
                    <select
                      name="children"
                      defaultValue=""
                      className={cn(inputClass, "w-full appearance-none pr-10")}
                    >
                      <option value="" disabled>
                        {tf("travelersPlaceholder")}
                      </option>
                      {travelerCounts.map((count) => (
                        <option key={count} value={count}>
                          {count}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/50" />
                  </div>
                </label>
              </div>
            </div>

            <CheckboxGroup label={tf("areasLabel")} name="areas" options={areas} />
            <CheckboxGroup label={tf("servicesLabel")} name="services" options={services} />
            <CheckboxGroup label={tf("interestsLabel")} name="interests" options={interests} />
            <CheckboxGroup label={tf("budgetLabel")} name="budget" options={budgetOptions} single />

            <label className={labelClass}>
              {tf("messageLabel")}
              <span className="text-[11px] normal-case tracking-normal text-cream/50">
                {tf("messageNote")}
              </span>
              <textarea
                name="message"
                rows={5}
                placeholder={tf("messagePlaceholder")}
                className={cn(inputClass, "resize-none")}
              />
            </label>

            <Link
              href="/cancel-policy"
              className="w-fit text-xs text-cream/50 underline transition-colors hover:text-gold"
            >
              {tf("policyLinkLabel")}
            </Link>

            <button
              type="submit"
              disabled={status === "sending"}
              className="border border-gold bg-red px-8 py-4 text-sm tracking-[0.08em] text-cream transition-colors hover:bg-red-hover disabled:opacity-60"
            >
              {status === "sending" ? tf("sending") : tf("submit")}
            </button>

            {status === "success" ? (
              <p className="text-sm text-gold">{tf("success")}</p>
            ) : null}
            {status === "error" ? (
              <p className="text-sm text-red">{tf("error")}</p>
            ) : null}
          </form>
        </FadeIn>
      </Container>
    </section>
  );
}
