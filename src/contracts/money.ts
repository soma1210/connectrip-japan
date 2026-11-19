/**
 * Currencies (Working Decision, T-03): JPY is the v1 base and the only
 * payment currency. USD stays in the union so display / payment can be
 * extended later without changing shapes. Multi-currency payment is not in v1.
 */
export type CurrencyCode = "JPY" | "USD";

/** The only currency a v1 booking can be charged in. */
export type PaymentCurrency = "JPY";

export type Money<C extends CurrencyCode = CurrencyCode> = {
  /** Integer in the currency's smallest unit (JPY has no minor unit: 5000 = ¥5,000). */
  amount: number;
  currency: C;
};
