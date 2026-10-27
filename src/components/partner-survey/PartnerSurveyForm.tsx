"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CircleCheck,
  Clock3,
  Handshake,
  Mail,
  Network,
  Send,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  CONSENT_TEXT,
  FIELDS,
  INDUSTRIES,
  INITIAL_VALUES,
  MAX_LENGTH,
  REVIEW_STEP_TITLE,
  STEPS,
  STEP_COUNT,
  industryLabel,
  type FieldDef,
  type FieldKey,
  type FormValues,
} from "@/features/partner-survey/config/questions";
import {
  MESSAGES,
  firstStepWithError,
  validateAll,
  validateStep,
} from "@/features/partner-survey/validation";
import type { FieldErrors } from "@/features/partner-survey/types";

const STEP_ICONS: LucideIcon[] = [Building2, Network, Handshake, Mail];
const REVIEW_STEP = STEPS.length;

const inputClass =
  "w-full border bg-cream px-4 py-3 text-base text-navy placeholder:text-navy/35 focus:border-navy/50 focus:outline-none focus:ring-2 focus:ring-navy/10 md:text-sm";

/** Two-digit step number: 01, 02 … */
const pad = (n: number) => String(n).padStart(2, "0");


function RequiredMark({ required }: { required: boolean }) {
  return required ? (
    <span className="ml-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red align-middle" aria-label="必須" />
  ) : (
    <span className="ml-2 border border-navy/20 px-1.5 py-px text-[10px] tracking-[0.05em] text-navy/50">任意</span>
  );
}

function Field({
  def,
  value,
  error,
  onChange,
}: {
  def: FieldDef;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const id = `partner-${def.key}`;
  const describedBy = [`${id}-hint`, error ? `${id}-error` : null].filter(Boolean).join(" ");
  const common = {
    id,
    name: def.key,
    value,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    "aria-required": def.required || undefined,
    className: cn(inputClass, error ? "border-red" : "border-navy/15"),
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="flex items-center text-sm font-medium tracking-[0.05em] text-navy">
        {def.label}
        <RequiredMark required={def.required} />
      </label>
      <p id={`${id}-hint`} className="text-xs leading-relaxed text-navy/55">
        {def.hint}
      </p>
      {def.kind === "select" ? (
        <select {...common} onChange={(event) => onChange(event.target.value)}>
          {INDUSTRIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : def.kind === "textarea" ? (
        <textarea
          {...common}
          rows={4}
          maxLength={MAX_LENGTH}
          placeholder={def.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={cn(common.className, "resize-y leading-relaxed")}
        />
      ) : (
        <input
          {...common}
          type={def.kind}
          maxLength={MAX_LENGTH}
          placeholder={def.placeholder || undefined}
          autoComplete={def.autoComplete}
          inputMode={def.kind === "tel" ? "tel" : def.kind === "url" ? "url" : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ThankYou({ receipt, homeHref }: { receipt: string; homeHref: string }) {
  return (
    <div className="bg-cream py-[60px] text-navy md:py-[100px]">
      <Container className="max-w-2xl">
        <div className="border border-navy/15 bg-white px-6 py-12 text-center shadow-sm md:px-12">
          <CircleCheck className="mx-auto h-14 w-14 text-red" strokeWidth={1.5} />
          <p className="mt-6 text-xs tracking-[0.2em] text-red">THANK YOU FOR CONNECTING</p>
          <h1 className="mt-3 font-heading-jp text-2xl text-navy md:text-3xl">ご回答ありがとうございます。</h1>
          <p className="mt-5 text-sm leading-relaxed text-navy/70">
            アンケートを受け付けました。
            <br />
            貴社の情報を、Connectrip Japanの提携候補として登録しました。
          </p>
          <p className="mx-auto mt-8 w-fit border border-gold/60 bg-cream px-6 py-3 text-sm">
            受付番号 <b className="ml-2 font-semibold tracking-[0.08em]" data-testid="receipt-no">{receipt}</b>
          </p>
          <div className="mt-8 border-t border-dashed border-navy/15 pt-8 text-left">
            <p className="text-sm font-semibold">このあとの流れ</p>
            <ol className="mt-3 flex flex-col gap-2 text-sm text-navy/75">
              {["Connectrip Japanが回答内容を確認", "必要に応じて担当者よりご連絡", "条件のご相談・提携の検討"].map(
                (item, index) => (
                  <li key={item} className="flex gap-3">
                    <span className="font-semibold text-red">{pad(index + 1)}.</span>
                    {item}
                  </li>
                ),
              )}
            </ol>
            <p className="mt-4 text-xs text-navy/50">ご回答時点で提携が成立するものではありません。</p>
          </div>
          <p className="mt-8 text-xs text-navy/50">このページを閉じていただいて構いません。</p>
          <Link href={homeHref} className="mt-4 inline-block text-xs text-navy/60 underline underline-offset-4 hover:text-red">
            Connectrip Japan トップへ
          </Link>
        </div>
      </Container>
    </div>
  );
}

/** `homeHref`: the site top that the thank-you screen links back to. */
export function PartnerSurveyForm({ homeHref }: { homeHref: string }) {
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState("");
  // One id per filled-in form: a retried or double-clicked submit is saved only once.
  const [submissionId] = useState(() => crypto.randomUUID());

  function goTo(next: number) {
    setStep(next);
    setReached((current) => Math.max(current, next));
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function focusFirstError(stepErrors: FieldErrors) {
    const key = Object.keys(stepErrors)[0];
    if (!key) return;
    requestAnimationFrame(() => document.getElementById(`partner-${key}`)?.focus());
  }

  /** Step nav: any reached step, as long as every step before it is valid. */
  function jumpTo(target: number) {
    if (target <= step) return goTo(target);
    for (let index = 0; index < Math.min(target, STEPS.length); index++) {
      const stepErrors = validateStep(index, values);
      if (Object.keys(stepErrors).length) {
        setErrors((current) => ({ ...current, ...stepErrors }));
        goTo(index);
        focusFirstError(stepErrors);
        return;
      }
    }
    goTo(target);
  }

  function update(key: FieldKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    if (step < REVIEW_STEP) {
      const stepErrors = validateStep(step, values);
      setErrors((current) => ({ ...current, ...stepErrors }));
      if (Object.keys(stepErrors).length) {
        setMessage("入力内容をご確認ください。");
        focusFirstError(stepErrors);
        return;
      }
      goTo(step + 1);
      return;
    }

    const allErrors = validateAll(values);
    if (Object.keys(allErrors).length) {
      setErrors(allErrors);
      goTo(Math.max(0, firstStepWithError(allErrors)));
      focusFirstError(allErrors);
      return;
    }
    if (!consent) {
      setMessage(MESSAGES.consent);
      return;
    }

    setSending(true);
    setMessage("");
    try {
      const response = await fetch("/api/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          submission_id: submissionId,
          privacy_consent: consent,
          website_confirm: honeypot,
        }),
      });
      const result = await response.json().catch(() => null);

      if (response.ok && result?.receipt) {
        setReceipt(result.receipt);
        window.scrollTo({ top: 0 });
        return;
      }
      if (response.status === 422 && result?.errors) {
        const serverErrors = result.errors as FieldErrors;
        setErrors(serverErrors);
        const errorStep = firstStepWithError(serverErrors);
        if (errorStep >= 0) {
          goTo(errorStep);
          focusFirstError(serverErrors);
        }
        setMessage(serverErrors.submission_id ?? serverErrors.privacy_consent ?? "入力内容をご確認ください。");
        return;
      }
      setMessage(
        response.status === 429
          ? "短時間に送信が集中しています。少し時間をおいてから再度お試しください。"
          : "送信できませんでした。時間をおいて再度お試しください。",
      );
    } catch {
      setMessage("送信できませんでした。通信環境をご確認のうえ、再度お試しください。");
    } finally {
      setSending(false);
    }
  }

  if (receipt) return <ThankYou receipt={receipt} homeHref={homeHref} />;

  const stepTitles = [...STEPS.map((s) => s.title), REVIEW_STEP_TITLE];
  const current = STEPS[step];
  const StepIcon = current ? STEP_ICONS[step] : ShieldCheck;
  const progress = ((step + 1) / STEP_COUNT) * 100;

  return (
    <div className="bg-cream py-[50px] text-navy md:py-[90px]">
      <Container className="max-w-5xl">
        {/* Intro */}
        <section className="text-center">
          <p className="text-xs tracking-[0.2em] text-red">LET’S CREATE THE NEXT JOURNEY</p>
          <h1 className="mt-4 font-heading-jp text-3xl leading-snug text-navy md:text-5xl">
            地域の魅力を、
            <br />
            <span className="text-red">一緒に旅へ。</span>
          </h1>
          <p className="mt-5 text-sm tracking-[0.1em] text-navy/80 md:text-base">Connectrip Japan パートナーアンケート</p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-navy/65">
            貴社の体験・サービスと提携条件をお聞かせください。
            <br className="hidden sm:inline" />
            ご回答いただいた内容をもとに、連携の可能性をご相談します。
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-navy/70">
            <span className="inline-flex items-center gap-1.5 border border-navy/15 bg-white px-3 py-1.5">
              <Clock3 className="h-3.5 w-3.5 text-red" /> 目安 5〜10分
            </span>
            <span className="inline-flex items-center gap-1.5 border border-navy/15 bg-white px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-red" /> 回答内容は一般公開されません
            </span>
          </div>
        </section>

        <div className="mt-10 grid gap-5 md:mt-14 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-8">
          {/* Step navigation: a row of five on phones, a column on desktop */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="mb-3 hidden text-xs tracking-[0.15em] text-navy/50 lg:block">
              QUESTIONNAIRE <span className="ml-1 font-semibold text-red">{pad(step + 1)} / {pad(STEP_COUNT)}</span>
            </p>
            <ol className="grid grid-cols-5 gap-1.5 lg:grid-cols-1 lg:gap-2">
              {stepTitles.map((title, index) => {
                const state = index === step ? "active" : index < step || index <= reached ? "done" : "todo";
                return (
                  <li key={title}>
                    <button
                      type="button"
                      onClick={() => jumpTo(index)}
                      disabled={index > reached || sending}
                      aria-current={index === step ? "step" : undefined}
                      className={cn(
                        "flex h-full w-full flex-col items-center justify-center gap-1.5 border px-1 py-2.5 text-center text-[10px] leading-tight transition-colors lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-3 lg:text-left lg:text-sm",
                        state === "active" && "border-navy bg-navy text-cream",
                        state === "done" && "border-navy/20 bg-white text-navy hover:border-navy/50",
                        state === "todo" && "border-navy/10 bg-white/60 text-navy/40",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                          state === "active" && "bg-gold text-navy",
                          state === "done" && "bg-red text-cream",
                          state === "todo" && "bg-navy/10 text-navy/50",
                        )}
                      >
                        {index < step ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
                      </span>
                      <b className="font-medium">{title}</b>
                      {index === step ? <ArrowRight className="ml-auto hidden h-4 w-4 lg:block" /> : null}
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="mt-5 hidden items-start gap-3 border-t border-dashed border-navy/15 pt-5 text-xs leading-relaxed text-navy/55 lg:flex">
              <Network className="h-5 w-5 shrink-0 text-gold" />
              <p>
                ひとつのつながりから、
                <br />
                新しい旅の可能性を。
              </p>
            </div>
          </aside>

          {/* Form card */}
          <section className="border border-navy/15 bg-white shadow-sm">
            <div
              className="h-1 bg-navy/10"
              role="progressbar"
              aria-label="回答の進み具合"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <span className="block h-full bg-red transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="border-b border-navy/10 px-5 py-6 md:px-10 md:py-8">
                <p className="text-xs tracking-[0.2em] text-red">STEP {pad(step + 1)}</p>
                <h2 className="mt-2 flex items-center gap-3 font-heading-jp text-2xl text-navy md:text-3xl">
                  <StepIcon className="h-6 w-6 shrink-0 text-gold" strokeWidth={1.5} />
                  {current ? current.title : "回答内容の確認"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-navy/65">
                  {current ? current.subtitle : "内容をご確認のうえ、送信してください。"}
                </p>
                {current ? (
                  <p className="mt-3 flex items-center text-xs text-navy/50">
                    <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-red" aria-hidden /> は必須項目です
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-7 px-5 py-7 md:px-10 md:py-9">
                {current ? (
                  current.fields.map((key) => (
                    <Field
                      key={key}
                      def={FIELDS[key]}
                      value={values[key]}
                      error={errors[key]}
                      onChange={(value) => update(key, value)}
                    />
                  ))
                ) : (
                  <>
                    {STEPS.map((section, index) => (
                      <section key={section.id} className="border border-navy/10">
                        <div className="flex items-center justify-between gap-3 border-b border-navy/10 bg-cream/60 px-4 py-3">
                          <h3 className="text-sm font-semibold">{section.title}</h3>
                          <button
                            type="button"
                            onClick={() => goTo(index)}
                            className="border border-navy/20 bg-white px-3 py-1 text-xs text-navy transition-colors hover:border-navy"
                          >
                            修正する
                          </button>
                        </div>
                        <dl className="divide-y divide-navy/10">
                          {section.fields.map((key) => {
                            const value = key === "industry" ? industryLabel(values[key]) : values[key].trim();
                            return (
                              <div key={key} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
                                <dt className="text-xs leading-relaxed text-navy/55">{FIELDS[key].label}</dt>
                                <dd className={cn("whitespace-pre-wrap break-words text-sm leading-relaxed", !value && "text-navy/35")}>
                                  {value || "未回答"}
                                </dd>
                              </div>
                            );
                          })}
                        </dl>
                      </section>
                    ))}

                    <div className="flex gap-3 border-l-4 border-gold bg-cream/70 px-4 py-4 text-sm leading-relaxed text-navy/75">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                      <div className="flex flex-col gap-2">
                        <b className="font-semibold text-navy">情報の取り扱いについて</b>
                        <p>
                          ご回答はConnectrip Japanの提携検討、条件調整、担当者様への連絡のために利用し、管理システムに保存します。回答内容は一般公開しません。修正・削除をご希望の場合は、このアンケートをご案内したConnectrip Japan担当者へご連絡ください。
                        </p>
                        <p>送信後は「候補」として登録されます。ご回答は提携契約の成立を意味するものではありません。</p>
                      </div>
                    </div>

                    <label
                      htmlFor="partner-consent"
                      className={cn(
                        "flex cursor-pointer items-start gap-3 border px-4 py-4 text-sm leading-relaxed transition-colors",
                        consent ? "border-navy bg-navy/[0.03]" : "border-navy/20",
                      )}
                    >
                      <input
                        id="partner-consent"
                        type="checkbox"
                        checked={consent}
                        onChange={(event) => {
                          setConsent(event.target.checked);
                          if (event.target.checked) setMessage("");
                        }}
                        className="mt-1 h-4 w-4 shrink-0 accent-red"
                      />
                      <span>{CONSENT_TEXT}</span>
                    </label>
                  </>
                )}

                {/* Honeypot: hidden from people and screen readers, filled in by bots. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                  <label>
                    この欄は空欄のままにしてください
                    <input
                      name="website_confirm"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(event) => setHoneypot(event.target.value)}
                    />
                  </label>
                </div>

                {message ? (
                  <p role="alert" className="border border-red/30 bg-red/5 px-4 py-3 text-sm text-red">
                    {message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col-reverse items-stretch gap-3 border-t border-navy/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-10">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => goTo(step - 1)}
                    disabled={sending}
                    className="inline-flex items-center justify-center gap-2 border border-navy/20 px-6 py-3.5 text-sm text-navy transition-colors hover:border-navy disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4" /> 戻る
                  </button>
                ) : (
                  <span className="text-center text-xs text-navy/50 sm:text-left">未確定の条件は「要相談」でOK</span>
                )}
                <button
                  type="submit"
                  disabled={sending || (step === REVIEW_STEP && !consent)}
                  className="inline-flex items-center justify-center gap-2 border border-gold bg-red px-8 py-4 text-sm tracking-[0.08em] text-cream transition-colors hover:bg-red-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending
                    ? "送信しています…"
                    : step === REVIEW_STEP
                      ? "同意して送信する"
                      : step === REVIEW_STEP - 1
                        ? "回答を確認する"
                        : "次へ進む"}
                  {step === REVIEW_STEP ? <Send className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </section>
        </div>
      </Container>
    </div>
  );
}
