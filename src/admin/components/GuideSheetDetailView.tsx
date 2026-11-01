import type { ReactNode } from "react";
import Link from "next/link";
import { datePart, splitChoices } from "@/features/guide-sheet/admin";
import { FIELDS, SECTIONS, type FieldDef } from "@/features/guide-sheet/config";
import type { GuideSheetData, InterviewRequest, SheetApplication } from "@/features/guide-sheet/types";
import { ChoiceChips } from "./PartnerRegistrationBadges";
import { EvaluationBadge, GuideSheetNotices, InterviewStatusBadge, SheetStatusBadge } from "./GuideSheetBadges";
import { GuideSheetRefresh } from "./GuideSheetRefresh";

export function GuideSheetDetailView({
  application: row,
  interviewRequests,
  data,
}: {
  application: SheetApplication;
  interviewRequests: InterviewRequest[];
  data: GuideSheetData;
}) {
  const { fields } = row;
  const missing = new Set(data.missingHeaders);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/guide-sheet" className="text-sm text-slate-500 hover:text-navy">
            ← ガイド応募（Google Form）
          </Link>
          <GuideSheetRefresh fetchedAt={data.fetchedAt} />
        </div>
        <GuideSheetNotices data={data} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Guide application</p>
            <h1 className="break-words text-2xl font-semibold tracking-tight">{fields.name || "（名前なし）"}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {fields.applicationId || "ID 未採番"} ・ {fields.submittedAt || "—"} 回答 ・ シート {row.rowNumber} 行目
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <SheetStatusBadge value={fields.status} />
              <InterviewStatusBadge value={fields.interviewStatus} />
              <EvaluationBadge value={fields.evaluation} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {fields.email ? (
              <a href={`mailto:${fields.email}`} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:border-navy">
                メールを送る
              </a>
            ) : null}
            {fields.phone ? (
              <a href={`tel:${fields.phone.replace(/[^\d+]/g, "")}`} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:border-navy">
                電話する
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          {SECTIONS.map((section) => (
            <Section key={section.value} title={section.title}>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {FIELDS.filter((field) => field.section === section.value && !missing.has(field.header)).map((field) => (
                  <Info key={field.key} label={field.header} wide={field.prose}>
                    <Answer field={field} value={fields[field.key]} />
                  </Info>
                ))}
              </dl>
            </Section>
          ))}
          {row.extraAnswers.length ? (
            <Section title="④ その他の回答">
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {row.extraAnswers.map((answer) => (
                  <Info key={answer.header} label={answer.header} wide>
                    {answer.value ? <Prose text={answer.value} /> : <Empty />}
                  </Info>
                ))}
              </dl>
            </Section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <Section title="管理情報（シートの値）">
            <dl className="flex flex-col gap-3">
              <Info label="Status">
                <SheetStatusBadge value={fields.status} />
              </Info>
              <Info label="Interview Status">
                <InterviewStatusBadge value={fields.interviewStatus} />
              </Info>
              <Info label="Evaluation">
                <EvaluationBadge value={fields.evaluation} />
              </Info>
              <Info label="Notes">{fields.notes ? <Prose text={fields.notes} /> : <Empty />}</Info>
              <Info label="Created At">{fields.createdAt || <Empty />}</Info>
              <Info label="Updated At">{fields.updatedAt || <Empty />}</Info>
            </dl>
            <p className="mt-4 text-xs text-slate-500">
              この画面からは変更できません。変更は Google Sheets で行ってください。
              {data.sheetUrl ? (
                <>
                  {" "}
                  <a href={data.sheetUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-navy">
                    Google Sheets で開く
                  </a>
                </>
              ) : null}
            </p>
          </Section>

          <Section title="面談リクエスト">
            {interviewRequests.length ? (
              <ul className="flex flex-col gap-3">
                {interviewRequests.map((request, index) => (
                  <li key={request.requestId || index} className="rounded-md border border-slate-200 p-3 text-xs">
                    <p className="font-medium text-navy">
                      {request.requestedStart || "—"}
                      {request.requestedEnd ? ` 〜 ${request.requestedEnd.split(" ").at(-1)}` : ""}
                    </p>
                    <dl className="mt-1.5 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-2 gap-y-1 text-slate-600">
                      <dt className="text-slate-500">承認</dt>
                      <dd>{request.approvalStatus || "—"}</dd>
                      <dt className="text-slate-500">確定日時</dt>
                      <dd>{request.confirmedAt || "—"}</dd>
                      <dt className="text-slate-500">受付日</dt>
                      <dd>{datePart(request.createdAt) || "—"}</dd>
                      {request.notes ? (
                        <>
                          <dt className="text-slate-500">メモ</dt>
                          <dd className="whitespace-pre-wrap break-words">{request.notes}</dd>
                        </>
                      ) : null}
                    </dl>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">ありません</p>
            )}
          </Section>
        </aside>
      </div>
    </div>
  );
}

function Answer({ field, value }: { field: FieldDef; value: string }) {
  if (!value) return <Empty />;
  if (field.key === "email") {
    return (
      <a href={`mailto:${value}`} className="text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy">
        {value}
      </a>
    );
  }
  if (field.multi) return <ChoiceChips labels={splitChoices(value)} />;
  if (field.prose) return <Prose text={value} />;
  return <>{value}</>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="mb-4 border-b border-slate-100 pb-2 text-sm font-semibold text-navy">{title}</h2>
      {children}
    </section>
  );
}

function Info({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="mb-1 text-xs text-slate-500">{label}</dt>
      <dd className="break-words text-sm">{children}</dd>
    </div>
  );
}

function Prose({ text }: { text: string }) {
  return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>;
}

function Empty() {
  return <span className="text-slate-400">—</span>;
}
