"use client";

import type { InquiryFormModel, InquirySubmitHandler } from "@/contracts";
import { InquiryForm } from "./InquiryForm";

/**
 * Preview wiring: the Inquiry backend is out of scope, so submissions go to a
 * mock handler. Nothing is sent or stored.
 */
const previewSubmit: InquirySubmitHandler = () =>
  new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 600));

export function PreviewInquiryForm({ model }: { model: InquiryFormModel }) {
  return (
    <InquiryForm
      model={model}
      onSubmit={previewSubmit}
      notice="Preview only: this form uses a mock handler. Nothing is sent or stored."
    />
  );
}
