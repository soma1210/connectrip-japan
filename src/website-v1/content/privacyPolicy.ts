import { V1_PREVIEW } from "../config";
import { COMPANY_PROFILE } from "./data/company";
import { PRIVACY_OFFICER, officerLine } from "./officers";

/**
 * Privacy Policy V1 (Human instruction 2026-11-14). English draft for
 * Website v1. Revised 2026-11-18 (management decision) to what the code and
 * services actually do:
 * - hosting: Vercel (production deploy target decided 2026-11-18);
 * - booking requests and inquiries: POST /api/v1/booking-requests and
 *   /api/v1/inquiries → Postgres on Neon (src/lib/inquiries), staff email via
 *   Resend SMTP (src/lib/notify), reviewed in /admin. The old booking Google
 *   Apps Script / Google Sheets path (src/lib/booking-request/gas.ts) is no
 *   longer called by any route, so it is no longer described;
 * - company mailbox contact@connectripjapan.com: Microsoft 365 (MX record);
 * - guide and partner applications: external Google Forms (routes.ts);
 * - public inquiry page: contact channels only (the form is preview only);
 * - payments: Stripe invoices in JPY (described in content, no code here);
 * - analytics: none on Website v1 (no GTM / GA / ad tags in src/app/v1);
 *   GTM exists only in the current site's layout (src/app/[locale]);
 * - browser storage: one sessionStorage key for the Home opening animation;
 * - rate limiting: client IP kept in memory ~10 minutes (src/lib/rate-limit).
 *
 * DRAFT, NOT legally approved. Values that are not confirmed are written as
 * `{{key}}` and listed in PRIVACY_PENDING. Until a human records approval and
 * every pending item is resolved, the policy is preview only:
 * - preview: `/v1/privacy-policy` shows the draft with "to confirm" markers;
 * - public mode: the route answers 404 (not in PUBLIC_PATHS, and the page
 *   calls notFound()); the existing `/privacy` page is unchanged.
 * The review copy of the text is generated from this file
 * (`.claude/legal/privacy-policy-v1-draft.md`), so the two never drift.
 */
export const PRIVACY_POLICY_SOURCE = "Privacy Policy V1, draft of 2026-11-15, revised 2026-11-18 (providers: Vercel, Neon, Resend, Microsoft 365). Pending company approval and legal review: not approved for publication";

/** Set by a human once the text is legally approved: `{ by: "name", at: "YYYY-MM-DD" }`. */
export const PRIVACY_POLICY_APPROVAL: { by: string; at: string } | null = null;

export type PendingKey =
  | "hostingRegion"
  | "databaseRegion"
  | "mailboxRegion"
  | "legacyStore"
  | "effectiveDate";

/** Unconfirmed facts. `proposed`: a value already used elsewhere on the site, not yet confirmed for this policy. */
export const PRIVACY_PENDING: Record<PendingKey, { label: string; proposed?: string; check: string }> = {
  hostingRegion: {
    label: "Where Vercel runs this website's server functions",
    proposed: "United States (Vercel's default region; no region is set in vercel.json)",
    check: "Vercel の本番プロジェクトの Functions Region を確認（vercel.json に指定なし＝既定リージョン）。東京等に変える場合はこの記載も合わせる",
  },
  databaseRegion: {
    label: "Where Neon stores the database",
    proposed: "Singapore (Amazon Web Services, ap-southeast-1), the region of the test database",
    check: "本番用 Neon プロジェクトのリージョンを確定（テスト用 connectrip-website-v2-test は ap-southeast-1＝シンガポール）",
  },
  mailboxRegion: {
    label: "Where Microsoft 365 stores the company mailbox",
    check: "Microsoft 365 管理センターの「データの場所」で contact@ のメールボックスの保存国を確認",
  },
  legacyStore: {
    label: "Store of past application data",
    check: "旧サイトのフォームで受けたガイド応募・事業者アンケート（guide_applications / partner_registrations）が現在どのデータベース（どの Neon プロジェクト・リージョン）にあるかを確認。データがなければこの行を削除",
  },
  effectiveDate: {
    label: "Effective date",
    check: "施行日（Last updated）を承認時に記入",
  },
};

/**
 * Management decisions recorded for this policy (company policy, not legal
 * review or technical verification). Decided on 2026-11-15.
 */
export const PRIVACY_DECISIONS = [
  { id: "privacyOfficer", decidedAt: "2026-11-15", decision: "Personal Information Management Officer: Soma Beppu (別府壮真), Director & Deputy Representative (取締役副代表)" },
  { id: "privacyContact", decidedAt: "2026-11-15", decision: "Privacy contact: contact@connectripjapan.com" },
  { id: "requestFee", decidedAt: "2026-11-15", decision: "Requests for disclosure, correction, suspension of use and similar: free of charge in principle" },
  { id: "address", decidedAt: "2026-11-15", decision: "Company address: 1-15-25 Nakajima, Nishiyodogawa-ku, Osaka, Japan (大阪市西淀川区中島1丁目15番25号)" },
] as const;

/**
 * Company address (management decision 2026-11-15), read from the same company
 * data as Company Profile and About so the three never differ. Sections 1 and 14.
 */
export const PRIVACY_ADDRESS: string = (() => {
  const row = COMPANY_PROFILE.rows.find((r) => r.label === "Address");
  if (!row || typeof row.value !== "string") throw new Error("Privacy Policy: company address missing in content/data/company.ts");
  return row.value;
})();

/** The official privacy contact (management decision 2026-11-15). Sections 1, 12 and 14. */
export const PRIVACY_CONTACT_EMAIL = "contact@connectripjapan.com";

/**
 * Technical checks that must be done before publication, separate from
 * management decisions and legal review. `done: true` only after a human
 * has actually verified it.
 */
export const PRIVACY_TECH_CHECKS: { id: string; label: string; done: boolean }[] = [
  { id: "privacyContactDelivery", label: "contact@connectripjapan.com: send and receive test, who reads it and the reply deadline", done: false },
];

export type PolicyBlock =
  | { kind: "p"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "dl"; items: [term: string, text: string][] }
  | { kind: "table"; headers: string[]; rows: string[][] };

export type PolicySection = {
  number: number;
  id: string;
  title: string;
  blocks: PolicyBlock[];
  /** Preview-only note: what in this section still needs a decision. */
  pending?: string;
};

const p = (text: string): PolicyBlock => ({ kind: "p", text });
const h3 = (text: string): PolicyBlock => ({ kind: "h3", text });
const ul = (...items: string[]): PolicyBlock => ({ kind: "ul", items });

export const PRIVACY_POLICY = {
  heading: "Privacy Policy",
  subheading: "PRIVACY POLICY",
  lastUpdated: "{{effectiveDate}}",
  sections: [
    {
      number: 1,
      id: "introduction",
      title: "Introduction and Data Controller",
      blocks: [
        p('Connectrip Japan Co., Ltd. (Connectrip Japan 株式会社, "Connectrip Japan", "we", "us" or "our") respects your privacy. This Privacy Policy explains how we collect, use, share and protect personal information when you visit our website, contact us, request or book our services, or apply to work with us.'),
        p("We handle personal information in accordance with the Act on the Protection of Personal Information of Japan (APPI) and other applicable laws. Where the data protection laws of other countries apply to our handling of your information, such as the EU or UK General Data Protection Regulation (GDPR), we also aim to meet their requirements."),
        p('Connectrip Japan Co., Ltd. is the business operator responsible for your personal information (the "data controller").'),
        {
          kind: "dl",
          items: [
            ["Company", "Connectrip Japan Co., Ltd."],
            ["Address", PRIVACY_ADDRESS],
            ["Representative", officerLine("representative")],
            ["Personal Information Management Officer", officerLine(PRIVACY_OFFICER)],
            ["Privacy contact", PRIVACY_CONTACT_EMAIL],
          ],
        },
      ],
    },
    {
      number: 2,
      id: "scope",
      title: "Scope of This Policy",
      blocks: [
        p("This policy applies to personal information we handle in connection with:"),
        ul(
          "Private Guide services (private tours planned around your request);",
          "Fixed Guided Tours (tours with a set itinerary and published price);",
          "general inquiries from travelers;",
          "business and partnership inquiries from companies and other organizations;",
          "guide applications and interviews; and",
          "the operation, security and improvement of this website.",
        ),
        p("This policy does not cover websites, apps or services run by others, including social media platforms and the external forms we link to (such as Google Forms). Those services have their own privacy policies. This policy does apply to the personal information we receive through them."),
      ],
    },
    {
      number: 3,
      id: "information-we-collect",
      title: "Information We Collect",
      blocks: [
        h3("Information you give us"),
        ul(
          "Booking requests (Private Guide and Fixed Guided Tours): your name, email address, phone number (optional), country or region of residence (optional), preferred and alternative dates and start times, tour length, the number of adults and children (or, for a fixed tour, the number of guests and your preferred guide language), the areas and interests you choose, and anything you write in your message.",
          "Information that helps us plan your tour: for example, mobility or accessibility needs, dietary requirements, allergies or health considerations. You never have to give us this to make a booking. Information about health or disability is sensitive personal information under the APPI: we collect it only when you choose to give it to us for your tour, and we treat your giving it as your consent to that use. We use it only to arrange your tour safely and share it only as described in Section 6.",
          "Inquiries: your name, email address and the details of your question. For business inquiries, also your company or organization name, your role and your business contact details.",
          "Guide applications and interviews: your name, contact details, area of residence, age range, languages and language level, guiding experience, availability, current occupation and other information you give us in the application form or in an interview. This includes applications and partner survey answers sent through the forms on our earlier website.",
          "Messages: if you contact us by email, WhatsApp or a social media direct message, we receive your message and the contact details or account name that the service shows us.",
          "Photos and videos taken during a tour in which you appear (see Section 5).",
        ),
        h3("Payment information"),
        p("Payments are processed by our payment service provider, Stripe. When you pay a Stripe invoice, you enter your card or payment details on Stripe's systems, and we do not receive or store your full card number. We receive the information we need to confirm and record your payment, such as the amount, date, payment status and limited card details (for example, the card brand and last four digits)."),
        h3("Information collected automatically"),
        p("When you visit this website, the servers of our hosting provider (Vercel) process technical information that your browser sends, such as your IP address, browser type, device information, the pages requested and the date and time of access. This is used to deliver the website, keep it secure and prevent abuse. Our booking form also uses your IP address for a short time to limit repeated submissions."),
        p("This website does not currently use cookies for analytics or advertising. See Section 9."),
      ],
    },
    {
      number: 4,
      id: "how-we-collect",
      title: "How We Collect Information",
      blocks: [
        p("We collect personal information:"),
        ul(
          "directly from you, when you fill in a form on this website, email us, message us on WhatsApp or social media, call us, or talk to us during a tour;",
          "through the external forms we link to, such as the Google Forms used for guide and partner applications;",
          "from the guides who deliver your tour, for example if something happens on the day that we need to follow up on;",
          "from travel companies or other business partners who make a request on your behalf, where this applies; and",
          "automatically, when you use this website (see Section 3).",
        ),
      ],
    },
    {
      number: 5,
      id: "how-we-use",
      title: "How We Use Personal Information",
      blocks: [
        p("We use personal information for the following purposes:"),
        ul(
          "to reply to your inquiries and booking requests, check availability and prepare quotes;",
          "to arrange, confirm and deliver your tour, including choosing a guide and contacting you before, during and after your tour;",
          "to issue invoices, process payments, cancellations and refunds, and keep accounting records;",
          "to provide customer support, handle feedback, complaints and incidents, and keep tours safe;",
          "to review guide applications, arrange interviews and manage our work with guides;",
          "to reply to business inquiries and manage our relationships with business partners;",
          "to run, maintain and secure this website, and to prevent fraud, spam and abuse;",
          "to improve our services, using information that does not identify you wherever possible;",
          "to send marketing messages, only if you have agreed to receive them (see below); and",
          "to comply with laws and regulations, respond to requests from public authorities, and establish or defend legal claims.",
        ),
        p("We do not use personal information beyond these purposes without your consent, except where the law allows it."),
        h3("Service messages and marketing"),
        p("Messages that are needed for your inquiry or booking are service messages: for example replies, quotes, invoices, booking confirmations, changes to your schedule and safety information. We send them whatever your marketing choices are."),
        p("We do not currently send newsletters or other marketing messages. If we start, we will send them only to people who have opted in, and you will be able to unsubscribe at any time with the link in the message or by contacting us. Unsubscribing does not stop service messages."),
        h3("Photos and videos"),
        p("Our guides may take photos or videos during a tour, for example as a souvenir for you. We do not use images in which you can be identified on our website, on social media or in advertising unless you have given us permission for that use, and we keep a record of that permission. For children, we ask a parent or guardian. Saying no does not affect your tour."),
        p("You can withdraw your permission at any time. We will then stop using the images in new material and remove them from our own website and social media accounts where we reasonably can. We may not be able to withdraw material that has already been printed or shared by others."),
        h3("Legal bases (EEA and UK)"),
        p("Where the GDPR applies, we rely on: the performance of a contract with you, or steps you ask us to take before one (booking requests and tours); our legitimate interests in replying to inquiries, running and securing our website, improving our services and managing business relationships, balanced against your rights; your consent (marketing, the use of images, and sensitive information where required), which you can withdraw at any time; and compliance with our legal obligations (for example, accounting and tax records)."),
      ],
    },
    {
      number: 6,
      id: "sharing",
      title: "Sharing and Disclosure",
      blocks: [
        p("We do not sell personal information. We do not give personal information to third parties except in the cases below or where the law otherwise allows it."),
        ul(
          "Guides who deliver your tour: guides work for us under a contract to deliver tours we arrange. We share only what a guide needs for your tour, usually your name, the date, time and meeting point, the number of people, your areas and interests, the language, and any accessibility, dietary or safety needs that matter for the tour. We share your phone number or messaging contact with the guide only when it is needed to reach you on the day. Guides must keep this information confidential, use it only for your tour and delete it after the tour.",
          "Service providers who work for us (see Section 7).",
          "Business transfers: if our business is merged, acquired or transferred, personal information may pass to the new owner, who must continue to protect it as described in this policy.",
          "Legal requirements and protection: where the law requires it; where it is necessary to protect someone's life, body or property and it is difficult to get your consent; or in response to lawful requests from courts, the police or other public authorities.",
          "With your consent: in any other case.",
        ),
        p("We do not share personal information with other companies for joint use."),
      ],
      pending: "ガイドとの契約（業務委託）に、秘密保持・目的外利用の禁止・ツアー後の削除の条項が入っていることを確認（運用資料の条項案を参照）。2026-11-18：旅行業登録まで宿泊・交通・入場等の手配をしない経営判断に合わせ、「ツアーに含まれる入場・予約・交通の手配先への提供」の項目を削除。登録後に手配を始める場合は復活させる。",
    },
    {
      number: 7,
      id: "service-providers",
      title: "Third-Party Service Providers",
      blocks: [
        p("We use service providers to run our business. They handle personal information on our behalf, under contract, only to provide their services to us. We supervise them as the law requires. The table also shows where each provider is based and where it stores data, as far as we can identify it."),
        {
          kind: "table",
          headers: ["Provider", "What they do for us", "Information involved", "Where"],
          rows: [
            ["Vercel", "Hosting this website and processing form submissions", "Technical information about your visit and the details you send through our forms, while they are processed", "Vercel is based in the United States. Server functions run in {{hostingRegion}}."],
            ["Neon", "Database that stores booking requests and inquiries, and their handling history", "The details you enter in the booking request and inquiry forms", "Neon is based in the United States. The database is stored in {{databaseRegion}}."],
            ["Resend", "Sending an email notice to our staff when a booking request or inquiry arrives", "The details of your request, including your name and email address", "Resend is based in the United States and sends email from servers in the United States."],
            ["Microsoft (Microsoft 365)", "Our company mailbox (contact@connectripjapan.com): receiving and replying to email", "Your email address and the content of your messages", "Microsoft is based in the United States. Our mailbox is stored in {{mailboxRegion}}."],
            ["Google (Google Forms)", "Guide and partner application forms", "The details you enter in those forms", "Google is based in the United States. Data is stored in Google's data centers in the United States and other countries; the service does not let us choose a single country."],
            ["Stripe", "Invoices and payments", "Your name, email address and payment information", "Stripe's systems in the United States and other countries"],
            ["Past application data", "Storing guide applications and partner survey answers received through our earlier website", "The details given in those forms", "{{legacyStore}}"],
          ],
        },
        p("If you contact us through WhatsApp, Instagram, Facebook or TikTok, those companies also handle your messages under their own privacy policies."),
      ],
      pending: "2026-11-18 修正：事業者は実際の構成（Vercel・Neon・Resend・Microsoft 365・Google フォーム・Stripe）に更新し、旧 Google Apps Script／スプレッドシートの行は使用していないため削除。残る確認：各社の契約主体（正式な法人名）、Vercel・Neon・Microsoft 365 の保存リージョン（{{…}}）、旧応募データの保存先、Google フォームが Workspace 契約か個人アカウントか、Stripe の契約主体（Stripe, Inc. / Stripe Payments Japan）と請求書の利用開始。",
    },
    {
      number: 8,
      id: "international-transfers",
      title: "International Data Transfers",
      blocks: [
        p("Some of our service providers are based outside Japan or store data outside Japan, mainly in the United States (see the table in Section 7)."),
        p("Where a provider only stores data for us and, under its contract, does not handle that data itself, this is not a provision of personal data to a third party under the APPI. We still protect the data based on an understanding of the personal information protection system of the country concerned (see Section 11)."),
        p("Where a provider outside Japan handles personal data on our behalf, we provide it only to providers that have established systems meeting the standards set under the APPI (for example, through contractual commitments and security controls), or with your consent. We take steps to make sure those measures continue to be applied and, if you ask, we will give you information about them."),
        p("Personal data that you send to us from the EEA or the UK is received in Japan, which the European Commission and the UK government recognize as providing an adequate level of data protection."),
      ],
      pending: "事業者ごとに「取り扱わない（クラウド例外: Q7-53・Q12-3）」か「委託（第28条）」かを契約で判定し、第28条の根拠（基準適合体制か本人同意か）と、本人の求めに応じた情報提供の手順を法務確認。EU/UK の十分性認定の記載と、GDPR の適用の有無も法務確認。",
    },
    {
      number: 9,
      id: "cookies",
      title: "Cookies and Analytics",
      blocks: [
        p("Cookies are small text files that a website stores in your browser. Similar technologies include local storage and session storage."),
        p("This website does not currently use analytics, advertising or social media tracking cookies, and does not load tools such as Google Analytics or Google Tag Manager. We do not use advertising tags."),
        p("We use your browser's session storage for one functional purpose only: to remember, while your browser tab is open, that the opening animation on our home page has already been shown. This stays in your browser, is not sent to us, and is cleared when you close the tab."),
        p("We plan to measure how visitors use this website with Google Analytics 4, loaded through Google Tag Manager. Before we do, we will update this section to explain what information is sent, to whom and why, and, where the law requires, we will ask for your consent through a cookie notice that also lets you refuse or later withdraw it. We will not send your name, email address, phone number or the content of your messages to Google Analytics."),
        p("You can also block or delete cookies in your browser settings."),
      ],
      pending: "GA4・GTM・Search Console は導入予定（未導入）。導入時は監査資料の第9条改訂案に差し替え、同意バナー（Consent Mode v2）を先に実装する。電気通信事業法の外部送信規律の対象かを法務確認。",
    },
    {
      number: 10,
      id: "retention",
      title: "Data Retention",
      blocks: [
        p("We keep personal information only for as long as we need it for the purposes in this policy, or as long as the law requires. After that, we delete it or make it anonymous."),
        {
          kind: "table",
          headers: ["Information", "How long we keep it"],
          rows: [
            ["Booking requests that do not lead to a booking, and general inquiries", "Up to 2 years after our last contact with you"],
            ["Confirmed bookings, invoices, payment and accounting records", "For the period required by Japanese law (generally 7 years from the end of the fiscal year of the transaction), or longer where the law requires"],
            ["Guide applications that do not lead to working together", "1 year after the selection ends"],
            ["Information about guides we work with", "While the contract lasts, then for as long as the law requires or we need it for our business (for example, payment records)"],
            ["Business inquiries that do not lead to a deal", "Up to 3 years after our last contact"],
            ["Records of complaints and incidents", "After the matter is resolved, for as long as needed under the applicable law (for example, legal limitation periods)"],
            ["Marketing preferences", "Until you withdraw your consent; after that, we keep only a minimal record (your email address and the date) so that we do not contact you again"],
            ["Photos and videos used with your permission", "In line with the permission you gave; we keep the record of your permission for as long as we use the material and as needed to show that we had it"],
            ["Server and security logs", "As set by our hosting provider; the IP address used to limit repeated booking form submissions is held for about 10 minutes"],
          ],
        },
        p("Where we must keep information for legal reasons, we use it only for that reason."),
      ],
      pending: "保存期間は経営承認前の暫定基準（2026-11-15）。自動削除は未実装で、運用資料の手動手順が前提。会計記録の年数（法人税法・欠損金の繰越）と旅行業法上の記録保存の有無を法務・税理士に確認。",
    },
    {
      number: 11,
      id: "security",
      title: "Data Security",
      blocks: [
        p("We take necessary and appropriate steps to prevent the leakage, loss or damage of personal information and to manage it safely, including:"),
        ul(
          "Rules: internal rules on how personal information is collected, used, stored, sent and deleted, and who is responsible for it.",
          `Organization: a Personal Information Management Officer (${officerLine(PRIVACY_OFFICER)}) who is responsible for how we handle personal information, access limited to those who need it, and a procedure for reporting and handling incidents.`,
          "People: confidentiality obligations and guidance on handling personal information for our staff and guides.",
          "Physical security: preventing unauthorized access to devices and documents, and preventing the theft or loss of devices.",
          "Technical security: encrypted connections (HTTPS) on this website, access controls and strong authentication on the services we use, and protection against unauthorized access.",
          "Outside Japan: our service providers are based in, and store data in, the countries shown in Section 7, mainly the United States. We take security measures based on an understanding of the personal information protection systems of those countries.",
        ),
        p("No way of sending or storing information is completely secure. If a data breach is likely to harm your rights and interests, we will report it to the Personal Information Protection Commission of Japan and tell you, as the law requires."),
      ],
      pending: "個人情報管理責任者は 2026-11-15 に任命済み（経営判断）。社内規程・漏えい時の手順（運用資料案）の承認と、実態に合わせた確定が残る。",
    },
    {
      number: 12,
      id: "your-rights",
      title: "Your Privacy Rights",
      blocks: [
        p("Under the APPI, you can ask us to:"),
        ul(
          "disclose the personal information we hold about you, and records of when we gave it to third parties;",
          "correct, add to or delete information that is inaccurate;",
          "stop using or delete information that we handle against the law, that we no longer need, or whose handling may harm your rights or legitimate interests; and",
          "stop giving it to third parties.",
        ),
        p("If you are in the EEA or the UK, you also have the right to access, correct or erase your personal data, to restrict or object to how we use it, to data portability, and to withdraw your consent at any time (this does not affect what we did before). You can also complain to your local data protection authority."),
        h3("How to make a request"),
        p(`Contact us at ${PRIVACY_CONTACT_EMAIL}. We will confirm your identity before we act, for example by asking for details that match our records. Someone you authorize can make a request for you with proof of that authority. For disclosure, you can ask us to provide the information electronically (for example, by email) or in writing. We will reply without undue delay and within the time the law requires.`),
        p("As a rule, requests for disclosure, correction, suspension of use or deletion, and the other requests above are free of charge."),
        p("If the law allows or requires us to refuse a request, for example where it would seriously disrupt our business or break another law, we will tell you why."),
      ],
    },
    {
      number: 13,
      id: "children-and-updates",
      title: "Children's Privacy and Policy Updates",
      blocks: [
        h3("Children"),
        p("Our services are booked by adults. Children may join tours with a parent or guardian, who gives us the information we need about them, such as the number of children. We do not knowingly collect personal information directly from children under 16 through this website. If you think a child has sent us personal information, please contact us and we will delete it."),
        h3("Updates to this policy"),
        p('We may update this policy when our services, the providers we use or the law change. We will post the new version on this page with a new "Last updated" date. If the changes are significant, we will tell you in advance with a notice on this website or, where appropriate, by email. Where the law requires your consent for a change, we will ask for it.'),
      ],
    },
    {
      number: 14,
      id: "contact",
      title: "Contact Us",
      blocks: [
        p("For questions, requests or complaints about how we handle personal information, please contact:"),
        {
          kind: "dl",
          items: [
            ["Company", "Connectrip Japan Co., Ltd."],
            ["Responsible Person", officerLine(PRIVACY_OFFICER)],
            ["Privacy Contact", PRIVACY_CONTACT_EMAIL],
            ["Address", PRIVACY_ADDRESS],
          ],
        },
        p("We can reply in English or Japanese."),
        p("If you are not satisfied with our reply, you can also contact the Personal Information Protection Commission of Japan: https://www.ppc.go.jp/en/"),
      ],
    },
  ] satisfies PolicySection[],
};

/** Every `{{key}}` in the policy text. */
export function privacyPolicyPlaceholders(): PendingKey[] {
  const texts: string[] = [PRIVACY_POLICY.lastUpdated];
  for (const s of PRIVACY_POLICY.sections) {
    for (const b of s.blocks as PolicyBlock[]) {
      if (b.kind === "p" || b.kind === "h3") texts.push(b.text);
      else if (b.kind === "ul") texts.push(...b.items);
      else if (b.kind === "dl") texts.push(...b.items.flat());
      else texts.push(...b.headers, ...b.rows.flat());
    }
  }
  const keys = new Set<PendingKey>();
  for (const t of texts) for (const m of t.matchAll(/\{\{(\w+)\}\}/g)) keys.add(m[1] as PendingKey);
  return [...keys];
}

/**
 * Publishable only with a recorded approval, no `{{…}}` left in the text, no
 * section still marked pending and every technical check done. Management
 * decisions (PRIVACY_DECISIONS) alone never make it publishable. Even then, going public also needs the
 * route in PUBLIC_PATHS and a deploy: both human decisions.
 */
export function privacyPolicyPublishable(): boolean {
  return (
    PRIVACY_POLICY_APPROVAL !== null &&
    privacyPolicyPlaceholders().length === 0 &&
    (PRIVACY_POLICY.sections as PolicySection[]).every((s) => !s.pending) &&
    PRIVACY_TECH_CHECKS.every((c) => c.done)
  );
}

/** Preview: the draft. Public mode: only once publishable. */
export const PRIVACY_POLICY_VISIBLE = V1_PREVIEW || privacyPolicyPublishable();

/**
 * Short notice shown next to forms before they are sent (preview only while
 * the policy is a draft). Purposes, guides, marketing.
 */
export const PRIVACY_FORM_NOTICE =
  "We use the details in this form to reply to you and, if you book, to arrange your tour. We share only what your guide needs for the day, and we never sell your information. We send marketing emails only if you ask for them.";
