"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import { ArrowRight, Check, CircleCheck, Clock3, Loader2, Plus, ShieldCheck, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { routeHref } from "@/website-v1/routes";
import {
  BUSINESS_CATEGORIES,
  CURRENT_CHALLENGES,
  CUSTOMER_TYPES,
  FIELD_ORDER,
  INBOUND_EXPERIENCE,
  INITIAL_VALUES,
  INTERESTED_COLLABORATIONS,
  LIMITS,
  NO_CHALLENGES,
  OTHER,
  type ChoiceOption,
  type FieldKey,
  type FormValues,
} from "@/features/partner-registration/config";
import { validateRegistration } from "@/features/partner-registration/validation";
import type { FieldErrors } from "@/features/partner-registration/types";

// Styling lives in these few class strings and small components, so the
// final design can be applied here without touching the form logic.
const inputClass =
  "min-h-12 min-w-0 w-full scroll-mt-28 rounded-[10px] border bg-white px-4 py-3 text-base leading-relaxed text-navy placeholder:text-navy/45 transition-[border-color,box-shadow] hover:border-navy/40 focus:border-navy focus:outline-none focus:ring-4 focus:ring-navy/10 aria-[invalid=true]:focus:ring-red/10";
const fieldId = (key: FieldKey) => `partner-registration-${key}`;

// --- building blocks ---------------------------------------------------------

function Badge({ required }: { required: boolean }) {
  return required ? (
    <span className="ml-3 mt-0.5 shrink-0 rounded bg-navy/[0.07] px-2 py-1 text-[11px] font-semibold leading-none text-navy/80">必須</span>
  ) : (
    <span className="ml-3 mt-0.5 shrink-0 rounded bg-[#f1f3f5] px-2 py-1 text-[11px] leading-none text-navy/60">任意</span>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`partner-section-${number}`} className="min-w-0">
      <header className="border-b border-navy/20 pb-5">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#896a30]">SECTION {number}</p>
        <h2 id={`partner-section-${number}`} className="mt-2 text-[22px] font-semibold tracking-tight text-navy md:text-2xl">{title}</h2>
      </header>
      <div className="flex flex-col gap-8 pt-7 md:gap-10 md:pt-8">{children}</div>
    </section>
  );
}

/**
 * Label, required/optional badge, hint and error around one question.
 * Choice groups render as a fieldset with a legend; text inputs as a label.
 */
function Question({
  id,
  label,
  required,
  hint,
  error,
  group = false,
  children,
}: {
  id: string;
  label: string;
  required: boolean;
  hint?: string;
  error?: string;
  group?: boolean;
  children: ReactNode;
}) {
  const heading = (
    <span className="flex items-start text-base font-semibold leading-relaxed text-navy">
      <span>{label}</span>
      <Badge required={required} />
    </span>
  );
  const body = (
    <>
      {hint ? (
        <p id={`${id}-hint`} className="-mt-1 text-sm leading-relaxed text-navy/65">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red">
          {error}
        </p>
      ) : null}
    </>
  );

  return group ? (
    <fieldset
      id={id}
      tabIndex={-1}
      aria-describedby={describedBy(id, Boolean(hint), error)}
      className="min-w-0 flex flex-col gap-3 scroll-mt-28 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
    >
      <legend className="mb-3">{heading}</legend>
      {body}
    </fieldset>
  ) : (
    <div className="flex flex-col gap-3">
      <label htmlFor={id}>{heading}</label>
      {body}
    </div>
  );
}

function describedBy(id: string, hint: boolean, error?: string) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

function ChoiceGroup({
  name,
  type,
  options,
  selected,
  invalid,
  onToggle,
}: {
  name: string;
  type: "radio" | "checkbox";
  options: readonly ChoiceOption[];
  selected: readonly string[];
  invalid: boolean;
  onToggle: (value: string, checked: boolean) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const checked = selected.includes(option.value);
        return (
          <label
            key={option.value}
            className={cn(
              "group flex min-h-[52px] min-w-0 cursor-pointer items-center gap-3 rounded-[10px] border px-4 py-3 text-[15px] leading-relaxed transition-[background-color,border-color,box-shadow] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-navy active:bg-navy/10 motion-reduce:transition-none",
              checked ? "border-navy bg-navy/[0.06] font-medium text-navy shadow-[inset_0_0_0_1px_#162e4c]" : "border-navy/20 bg-white text-navy/85 hover:border-navy/50",
              invalid && !checked && "border-red/40",
            )}
          >
            <input
              type={type}
              name={name}
              value={option.value}
              checked={checked}
              onChange={(event) => onToggle(option.value, event.target.checked)}
              className="sr-only"
            />
            <span aria-hidden="true" className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center border-2",
              type === "radio" ? "rounded-full" : "rounded-[5px]",
              checked ? "border-navy bg-navy" : "border-navy/30 bg-white",
            )}>
              {checked ? type === "radio" ? <span className="h-2 w-2 rounded-full bg-white" /> : <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} /> : null}
            </span>
            <span className="min-w-0 break-words">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function Brand() {
  return (
    <div className="inline-flex items-center gap-3 text-left">
      <Image src="/images/logo/logo.png" alt="Connectrip Japan" width={64} height={64} className="h-14 w-14 rounded-full md:h-16 md:w-16" />
      <span aria-hidden="true" className="text-[13px] font-semibold tracking-[0.16em] text-navy">CONNECTRIP<span className="mt-1 block text-[11px] tracking-[0.32em] text-navy/60">JAPAN</span></span>
    </div>
  );
}

function ThankYou() {
  return (
    <div className="bg-[#f6f7f8] py-12 font-sans text-navy md:py-20">
      <Container className="max-w-2xl">
        <div className="rounded-[14px] border border-navy/10 border-t-[3px] border-t-gold bg-white px-5 py-10 text-center shadow-[0_8px_40px_-24px_#162e4c55] md:px-12 md:py-14">
          <Brand />
          <div className="mx-auto mt-10 flex h-20 w-20 items-center justify-center rounded-full bg-navy/[0.05]">
            <CircleCheck aria-hidden="true" className="h-11 w-11 text-navy" strokeWidth={1.5} />
          </div>
          <p className="mt-6 text-xs font-semibold tracking-[0.2em] text-[#896a30]">THANK YOU</p>
          <h1 className="mt-6 text-[22px] font-semibold text-navy sm:text-2xl md:text-3xl">
            ご回答
            <br className="sm:hidden" />
            ありがとうございます！
          </h1>
          <p className="mt-6 text-[15px] leading-relaxed text-navy/75">
            いただいた内容は、Connectrip Japanにて確認いたします。
            <br className="hidden sm:inline" />
            今後ご一緒できそうな取り組みがありましたら、こちらからご連絡させていただくことがあります。
          </p>
          <p className="mt-5 text-[15px] leading-relaxed text-navy/75">今後ともConnectrip Japanをよろしくお願いいたします。</p>
          <Link href={routeHref("home")} className="mt-10 inline-block text-sm text-navy/60 underline underline-offset-4 hover:text-navy">
            Connectrip Japan トップへ
          </Link>
        </div>
      </Container>
    </div>
  );
}

// --- form --------------------------------------------------------------------

export function PartnerRegistrationForm() {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [honeypot, setHoneypot] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  // One id per filled-in form: a retried or double-clicked submit is saved only once.
  const [submissionId] = useState(() => crypto.randomUUID());

  function clearErrors(...keys: FieldKey[]) {
    if (!keys.some((key) => errors[key])) return;
    setErrors((current) => {
      const next = { ...current };
      for (const key of keys) delete next[key];
      return next;
    });
  }

  function set<K extends FieldKey>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    clearErrors(key);
  }

  /** Re-check one field when the respondent leaves it, but only once it has content. */
  function checkOnBlur(key: "website" | "email" | "phone") {
    if (!values[key].trim()) return;
    const error = validateRegistration(values)[key];
    setErrors((current) => ({ ...current, [key]: error }));
  }

  function toggle(
    key: "customer_types" | "current_challenges" | "interested_collaborations",
    value: string,
    checked: boolean,
  ) {
    setValues((current) => {
      let list = checked ? [...current[key], value] : current[key].filter((item) => item !== value);
      // 「特にない」 and the other challenges exclude each other.
      if (key === "current_challenges" && checked) {
        list = value === NO_CHALLENGES ? [NO_CHALLENGES] : list.filter((item) => item !== NO_CHALLENGES);
      }
      return { ...current, [key]: list };
    });
    clearErrors(key, `${key}_other` as FieldKey);
  }

  function setAccount(index: number, value: string) {
    set(
      "social_accounts",
      values.social_accounts.map((account, i) => (i === index ? value : account)),
    );
  }

  function focusFirstError(found: FieldErrors) {
    const key = FIELD_ORDER.find((k) => found[k]);
    if (!key) return;
    const element =
      key === "social_accounts"
        ? document.getElementById(`${fieldId(key)}-0`)
        : document.getElementById(fieldId(key));
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
    element?.focus({ preventScroll: true });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const found = validateRegistration(values);
    setErrors(found);
    setMessage("");
    if (Object.keys(found).length) {
      focusFirstError(found);
      return;
    }

    setSending(true);
    setMessage("");
    try {
      const response = await fetch("/api/partner-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, submission_id: submissionId, website_confirm: honeypot }),
      });
      const result = await response.json().catch(() => null);

      if (response.ok && result?.success) {
        setDone(true);
        window.scrollTo({ top: 0 });
        return;
      }
      if (response.status === 422 && result?.errors) {
        const serverErrors = result.errors as FieldErrors;
        setErrors(serverErrors);
        if (serverErrors.submission_id) setMessage(serverErrors.submission_id);
        focusFirstError(serverErrors);
        return;
      }
      setMessage(
        response.status === 429
          ? "短時間に送信が集中しています。少し時間をおいてから、もう一度お試しください。"
          : "送信できませんでした。入力内容はそのまま残っていますので、時間をおいてもう一度お試しください。",
      );
    } catch {
      setMessage("送信できませんでした。通信環境をご確認のうえ、もう一度お試しください。入力内容はそのまま残っています。");
    } finally {
      setSending(false);
    }
  }

  if (done) return <ThankYou />;

  // Live count, so the notice by the submit button goes away as answers are fixed.
  const errorCount = Object.values(errors).filter(Boolean).length;

  /** Props shared by the one-line and multi-line text inputs. */
  const textProps = (key: FieldKey, hint = false) => ({
    id: fieldId(key),
    name: key,
    value: values[key] as string,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": describedBy(fieldId(key), hint, errors[key]),
    className: cn(inputClass, errors[key] ? "border-red" : "border-navy/15"),
  });

  return (
    <div className="border-t-[3px] border-gold bg-[#f6f7f8] pb-14 pt-8 font-sans text-navy md:pb-24 md:pt-12">
      <Container className="max-w-[800px]! md:px-10">
        {/* Intro */}
        {/* The v1 header already shows the logo, so the intro has none (the Thank You screen keeps it). */}
        <section className="text-center">
          <p className="text-xs font-semibold tracking-[0.24em] text-[#896a30]">PARTNER SURVEY</p>
          <h1 className="mx-auto mt-3 max-w-2xl text-[26px] font-semibold leading-[1.55] tracking-tight text-balance text-navy md:text-[32px]"><span className="block sm:inline">事業者・パートナー向け</span><span className="block sm:inline">アンケート</span></h1>
          <div className="mx-auto mt-5 max-w-xl space-y-3 text-left text-[15px] leading-[1.9] text-navy/70 sm:text-center">
            <p>
              Connectrip Japanは、訪日外国人旅行者向けの観光サービスを展開しています。これから関西を中心に、さまざまな事業者の皆さまと一緒に、より魅力的な旅の体験をつくっていきたいと考えています。
            </p>
            <p>まずはお互いを知るきっかけとして、貴社・貴店について簡単に教えてください。</p>
          </div>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-navy/10 bg-white px-4 py-2 text-sm text-navy/70">
            <Clock3 aria-hidden="true" className="h-4 w-4 text-[#896a30]" /> 所要時間 約3分
          </p>
        </section>

        <form onSubmit={handleSubmit} noValidate className="mt-10 flex flex-col gap-12 md:mt-14 md:gap-14">
          <Section number="01" title="基本情報">
            <Question id={fieldId("company_name")} label="会社名・店舗名" required error={errors.company_name}>
              <input
                {...textProps("company_name")}
                type="text"
                maxLength={LIMITS.text}
                autoComplete="organization"
                placeholder="例：株式会社〇〇 / 〇〇 Hotel / 〇〇 Restaurant"
                onChange={(event) => set("company_name", event.target.value)}
              />
            </Question>

            <Question id={fieldId("contact_name")} label="担当者名" required error={errors.contact_name}>
              <input
                {...textProps("contact_name")}
                type="text"
                maxLength={LIMITS.text}
                autoComplete="name"
                placeholder="例：山田 太郎"
                onChange={(event) => set("contact_name", event.target.value)}
              />
            </Question>

            <Question
              id={fieldId("business_category")}
              label="事業カテゴリ"
              required
              hint="最も近いものを1つお選びください。"
              error={errors.business_category}
              group
            >
              <ChoiceGroup
                name="business_category"
                type="radio"
                options={BUSINESS_CATEGORIES}
                selected={[values.business_category]}
                invalid={Boolean(errors.business_category)}
                onToggle={(value) => {
                  set("business_category", value);
                  clearErrors("business_category_other");
                }}
              />
              {values.business_category === OTHER ? (
                <OtherInput
                  id={fieldId("business_category_other")}
                  label="「その他」の事業内容"
                  placeholder="例：着物レンタル、交通・送迎 など"
                  value={values.business_category_other}
                  error={errors.business_category_other}
                  onChange={(value) => set("business_category_other", value)}
                />
              ) : null}
            </Question>

            <Question
              id={fieldId("area")}
              label="所在地または主な対応エリア"
              required
              hint="店舗・施設の所在地、またはサービスを提供している主なエリアをご記入ください。"
              error={errors.area}
            >
              <input
                {...textProps("area", true)}
                type="text"
                maxLength={LIMITS.text}
                placeholder="例：大阪市中央区 / 大阪・京都 / 関西全域"
                onChange={(event) => set("area", event.target.value)}
              />
            </Question>

            <Question id={fieldId("website")} label="Webサイト" required={false} error={errors.website}>
              <input
                {...textProps("website")}
                type="url"
                inputMode="url"
                maxLength={LIMITS.text}
                autoComplete="url"
                placeholder="https://example.com"
                onChange={(event) => set("website", event.target.value)}
                onBlur={() => checkOnBlur("website")}
              />
            </Question>

            <Question
              id={fieldId("social_accounts")}
              label="SNSアカウント"
              required={false}
              hint="媒体は問いません（Instagram、TikTok、Facebook、X、YouTubeなど）。URLまたはアカウント名をご入力ください。"
              error={errors.social_accounts}
              group
            >
              <div className="flex flex-col gap-2">
                {values.social_accounts.map((account, index) => (
                  <div key={index} className="flex min-w-0 items-center gap-2">
                    <input
                      id={`${fieldId("social_accounts")}-${index}`}
                      name={`social_accounts[${index}]`}
                      type="text"
                      value={account}
                      maxLength={LIMITS.text}
                      aria-label={`SNSアカウント ${index + 1}`}
                      placeholder={index === 0 ? "例：https://instagram.com/xxxx または @xxxx" : "別のアカウント"}
                      onChange={(event) => setAccount(index, event.target.value)}
                      className={cn(inputClass, errors.social_accounts ? "border-red" : "border-navy/15")}
                    />
                    {values.social_accounts.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          set(
                            "social_accounts",
                            values.social_accounts.filter((_, i) => i !== index),
                          )
                        }
                        aria-label={`SNSアカウント ${index + 1} を削除`}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border border-navy/20 bg-white text-navy/60 hover:border-navy/40 hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              {values.social_accounts.length < LIMITS.socialAccounts ? (
                <button
                  type="button"
                  onClick={() => set("social_accounts", [...values.social_accounts, ""])}
                  className="inline-flex min-h-11 w-fit items-center gap-2 rounded-[10px] border border-navy/20 bg-white px-4 py-2 text-sm font-medium text-navy/80 transition-colors hover:border-navy/50 hover:bg-navy/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                >
                  <Plus className="h-4 w-4" /> アカウントを追加
                </button>
              ) : null}
            </Question>
          </Section>

          <Section number="02" title="現在の事業について">
            <Question
              id={fieldId("customer_types")}
              label="主な顧客層"
              required
              hint="当てはまるものをすべてお選びください。"
              error={errors.customer_types}
              group
            >
              <ChoiceGroup
                name="customer_types"
                type="checkbox"
                options={CUSTOMER_TYPES}
                selected={values.customer_types}
                invalid={Boolean(errors.customer_types)}
                onToggle={(value, checked) => toggle("customer_types", value, checked)}
              />
            </Question>

            <Question
              id={fieldId("inbound_experience")}
              label="訪日外国人の受け入れ実績"
              required
              hint="現在の状況に近いものを1つお選びください。"
              error={errors.inbound_experience}
              group
            >
              <ChoiceGroup
                name="inbound_experience"
                type="radio"
                options={INBOUND_EXPERIENCE}
                selected={[values.inbound_experience]}
                invalid={Boolean(errors.inbound_experience)}
                onToggle={(value) => set("inbound_experience", value)}
              />
            </Question>

            <Question
              id={fieldId("strengths")}
              label="自社・店舗の強みやおすすめポイントを教えてください"
              required
              hint="外国人旅行者におすすめしたいポイントなど、1〜3文程度で簡単にご記入ください。"
              error={errors.strengths}
            >
              <textarea
                {...textProps("strengths", true)}
                rows={4}
                maxLength={LIMITS.textarea}
                placeholder="例：築100年の町家で、職人と一緒に和菓子づくりを体験できます。英語の説明シートもご用意しています。"
                onChange={(event) => set("strengths", event.target.value)}
                className={cn(textProps("strengths").className, "resize-y leading-relaxed")}
              />
            </Question>

            <Question
              id={fieldId("current_challenges")}
              label="現在感じている課題"
              required
              hint="当てはまるものをすべてお選びください。"
              error={errors.current_challenges}
              group
            >
              <ChoiceGroup
                name="current_challenges"
                type="checkbox"
                options={CURRENT_CHALLENGES}
                selected={values.current_challenges}
                invalid={Boolean(errors.current_challenges)}
                onToggle={(value, checked) => toggle("current_challenges", value, checked)}
              />
              {values.current_challenges.includes(OTHER) ? (
                <OtherInput
                  id={fieldId("current_challenges_other")}
                  label="「その他」の課題"
                  value={values.current_challenges_other}
                  error={errors.current_challenges_other}
                  onChange={(value) => set("current_challenges_other", value)}
                />
              ) : null}
            </Question>
          </Section>

          <Section number="03" title="今後の連携について">
            <Question
              id={fieldId("interested_collaborations")}
              label="興味のある連携内容"
              required
              hint="興味のあるものがあればお選びください（複数選択可）。まだ決まっていなくても大丈夫です。"
              error={errors.interested_collaborations}
              group
            >
              <ChoiceGroup
                name="interested_collaborations"
                type="checkbox"
                options={INTERESTED_COLLABORATIONS}
                selected={values.interested_collaborations}
                invalid={Boolean(errors.interested_collaborations)}
                onToggle={(value, checked) => toggle("interested_collaborations", value, checked)}
              />
              {values.interested_collaborations.includes(OTHER) ? (
                <OtherInput
                  id={fieldId("interested_collaborations_other")}
                  label="「その他」の連携内容"
                  value={values.interested_collaborations_other}
                  error={errors.interested_collaborations_other}
                  onChange={(value) => set("interested_collaborations_other", value)}
                />
              ) : null}
            </Question>

            <Question id={fieldId("email")} label="ご連絡先メールアドレス" required error={errors.email}>
              <input
                {...textProps("email")}
                type="email"
                inputMode="email"
                maxLength={254}
                autoComplete="email"
                placeholder="例：info@example.com"
                onChange={(event) => set("email", event.target.value)}
                onBlur={() => checkOnBlur("email")}
              />
            </Question>

            <Question
              id={fieldId("phone")}
              label="電話番号"
              required={false}
              hint="お電話での連絡をご希望の場合のみご記入ください。"
              error={errors.phone}
            >
              <input
                {...textProps("phone", true)}
                type="tel"
                inputMode="tel"
                maxLength={30}
                autoComplete="tel"
                placeholder="例：06-1234-5678"
                onChange={(event) => set("phone", event.target.value)}
                onBlur={() => checkOnBlur("phone")}
              />
            </Question>

            <Question
              id={fieldId("additional_notes")}
              label="その他、相談したいこと・伝えておきたいことがあればご記入ください"
              required={false}
              error={errors.additional_notes}
            >
              <textarea
                {...textProps("additional_notes")}
                rows={4}
                maxLength={LIMITS.textarea}
                onChange={(event) => set("additional_notes", event.target.value)}
                className={cn(textProps("additional_notes").className, "resize-y leading-relaxed")}
              />
            </Question>
          </Section>

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

          <div className="flex flex-col items-center gap-5 border-t border-navy/20 pt-8 md:pt-10">
            {errorCount || message ? (
              <p role="alert" className="w-full rounded-md border border-red/30 bg-red/5 px-4 py-3 text-sm leading-relaxed text-red">
                {message || `未入力または修正が必要な項目が${errorCount}件あります。赤字のメッセージをご確認ください。`}
              </p>
            ) : null}
            <ShieldCheck aria-hidden="true" className="h-6 w-6 text-[#896a30]" />
            <p className="max-w-lg text-center text-sm leading-relaxed text-navy/65">
              ご回答内容は、Connectrip Japanからのご連絡と今後の連携の検討にのみ利用し、一般には公開しません。
            </p>
            <button
              type="submit"
              disabled={sending}
              aria-busy={sending || undefined}
              className="inline-flex min-h-[60px] w-full max-w-md items-center justify-center gap-3 rounded-[10px] bg-navy px-5 py-4 text-base font-semibold tracking-[0.04em] text-white shadow-[0_4px_12px_#162e4c22] transition-[background-color,transform,box-shadow] hover:bg-navy-light hover:shadow-md active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy disabled:cursor-wait disabled:opacity-65 motion-reduce:transition-none"
            >
              {sending ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none" /> : null}
              {sending ? "送信中..." : "アンケートを送信する"}
              {!sending ? <ArrowRight aria-hidden="true" className="h-4 w-4" /> : null}
            </button>
          </div>
        </form>
      </Container>
    </div>
  );
}

/** The text box that appears under a choice group when 「その他」 is selected. */
function OtherInput({
  id,
  label,
  placeholder = "具体的にご記入ください",
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-1 flex flex-col gap-2 rounded-[10px] border-l-[3px] border-gold bg-white p-4">
      <label htmlFor={id} className="flex items-center text-sm text-navy/80">
        {label}
        <Badge required />
      </label>
      <input
        id={id}
        type="text"
        value={value}
        maxLength={LIMITS.text}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(inputClass, error ? "border-red" : "border-navy/15")}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}
