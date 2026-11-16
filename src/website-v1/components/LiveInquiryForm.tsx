"use client";

import { useRef } from "react";
import type { InquiryFormModel, InquirySubmitHandler } from "@/contracts";
import { InquiryForm } from "./InquiryForm";

/**
 * Live wiring of the Inquiry form (2026-11-16): `POST /api/v1/inquiries`.
 * One submission id per message: a retry after an unclear failure, or a
 * double click, reuses it, so the server stores and emails it once. A new id
 * is drawn only after a stored inquiry.
 */
export function LiveInquiryForm({ model }: { model: InquiryFormModel }) {
  const submissionId = useRef<string | null>(null);

  const post = async (values: Parameters<InquirySubmitHandler>[0]) => {
    submissionId.current ??= crypto.randomUUID();
    const id = submissionId.current;
    const response = await fetch("/api/v1/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": id },
      body: JSON.stringify({ ...values, submissionId: id }),
    });
    const body = (await response.json().catch(() => null)) as { ok?: boolean; kind?: string; fieldErrors?: Record<string, string> } | null;
    return { response, body };
  };

  const submit: InquirySubmitHandler = async (values) => {
    let result;
    try {
      result = await post(values);
      // Same id, edited message after an unclear failure: that id is taken, so send the new text under a new id (once).
      if (result.response.status === 409) {
        submissionId.current = null;
        result = await post(values);
      }
    } catch {
      return { ok: false, kind: "network" };
    }
    const { response, body } = result;
    if (response.ok && body?.ok) {
      submissionId.current = null;
      return { ok: true };
    }
    if (response.status === 400 && body?.kind === "validation") {
      submissionId.current = null; // nothing was stored
      return { ok: false, kind: "validation", fieldErrors: body.fieldErrors as never };
    }
    if (response.status === 429) return { ok: false, kind: "rate_limited" };
    return { ok: false, kind: "server" };
  };

  return <InquiryForm model={model} onSubmit={submit} live />;
}
