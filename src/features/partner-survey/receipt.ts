// Receipt numbers shown to the partner on the thank-you screen:
// P-YYYYMMDD-NNNN, dated in Japan time. Uniqueness is enforced by the
// database (UNIQUE on receipt_no); the API retries with a new number on a clash.

export const RECEIPT_PATTERN = /^P-\d{8}-\d{4}$/;

export function receiptDate(now: Date) {
  // en-CA formats as YYYY-MM-DD.
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" }).replaceAll("-", "");
}

export function generateReceiptNo(now = new Date(), random = Math.random) {
  const serial = Math.floor(random() * 10_000)
    .toString()
    .padStart(4, "0");
  return `P-${receiptDate(now)}-${serial}`;
}
