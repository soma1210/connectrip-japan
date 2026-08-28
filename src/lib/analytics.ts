export type CtaPosition =
  | "header"
  | "mobile_menu"
  | "hero"
  | "section"
  | "footer"
  | "floating"
  | "form";

type DataLayerEvent = Record<string, unknown> & { event: string };

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
  }
}

function pushToDataLayer(data: DataLayerEvent) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
}

export function trackCtaClick({
  event,
  ctaId,
  ctaText,
  ctaPosition,
  locale,
}: {
  event: "reserve_cta_click" | "contact_cta_click";
  ctaId: string;
  ctaText: string;
  ctaPosition: CtaPosition;
  locale: string;
}) {
  if (typeof window === "undefined") return;
  pushToDataLayer({
    event,
    cta_id: ctaId,
    cta_text: ctaText,
    cta_position: ctaPosition,
    page_path: window.location.pathname,
    page_title: document.title,
    locale,
  });
}

export function trackFormSubmit({
  event,
  formType,
  locale,
}: {
  event: "reservation_submit" | "contact_submit" | "business_inquiry_submit";
  formType: "reservation" | "contact" | "business_inquiry";
  locale: string;
}) {
  if (typeof window === "undefined") return;
  pushToDataLayer({
    event,
    form_type: formType,
    page_path: window.location.pathname,
    page_title: document.title,
    locale,
  });
}
