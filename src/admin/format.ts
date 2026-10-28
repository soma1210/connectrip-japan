const jpy = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const timestamp = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Tokyo",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** `YYYY-MM-DD` as a calendar date. Japan-local booking dates have no time component. */
export function formatIsoDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatTimestamp(iso: string) {
  return `${timestamp.format(new Date(iso))} JST`;
}

export function formatJpy(amount: number) {
  return jpy.format(amount);
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${hours} h ${remainder} min`;
}

export function formatGuests(adults: number, children: number) {
  const adultLabel = `${adults} adult${adults === 1 ? "" : "s"}`;
  if (children <= 0) return adultLabel;
  return `${adultLabel}, ${children} child${children === 1 ? "" : "ren"}`;
}
