import { V1_PREVIEW } from "../config";
import { COMPANY_PROFILE } from "./data/company";
import { PRIVACY_OFFICER, officerLine } from "./officers";

/**
 * Website V2 policy: existing 14-section text, prepared for public-mode display
 * on the owner's 2026-11-19 instruction. This is content approval, not a claim
 * that legal or operational checks have been completed, or deploy approval.
 * See .claude/legal/privacy-policy-v2-release-review.md for the exact changes
 * and unresolved release checks. The original draft remains historical evidence.
 */
export const PRIVACY_POLICY_SOURCE = "Privacy Policy, revised 2026-11-19";

/** Owner's explicit instruction in the 2026-11-19 implementation request. */
export const PRIVACY_POLICY_APPROVAL: { by: string; at: string; scope: string } | null = {
  by: "Owner (instruction in the 2026-11-19 Codex chat)",
  at: "2026-11-19",
  scope: "Render the existing approved policy in PR #4; no merge or production deployment. Not legal verification.",
};

export type PendingKey =
  | "hostingCountry"
  | "databaseCountry"
  | "emailSendingCountry"
  | "mailboxCountry"
  | "formsCountry"
  | "paymentProvider"
  | "legacyStore"
  | "effectiveDate";

/**
 * Facts not yet confirmed (2026-11-18 rules: no guessed countries or regions;
 * only what the law needs, which is the country, not technical regions).
 * Each value is filled in only from what a person has checked.
 */
export const PRIVACY_PENDING: Record<PendingKey, { label: string; proposed?: string; check: string }> = {
  hostingCountry: {
    label: "Country where Vercel handles the data",
    check: "Vercel 本番プロジェクトの Functions Region（Settings → Functions）を確認し、その国名を記入。リージョン名などの技術的詳細は書かない",
  },
  databaseCountry: {
    label: "Country where Neon stores the data",
    check: "本番 Neon プロジェクトのリージョンの国名を記入（確認済みの事実：テスト用はシンガポール。本番は未作成）",
  },
  emailSendingCountry: {
    label: "Country from which Resend sends our email",
    check: "Resend → Domains → notify.connectripjapan.com の Region の国名を記入",
  },
  mailboxCountry: {
    label: "Country where Microsoft 365 stores our mailbox",
    check: "Microsoft 365 管理センター → 設定 → 組織設定 → 組織プロファイル → データの場所 の国名を記入",
  },
  formsCountry: {
    label: "Country where Google stores Google Forms answers",
    check: "Google フォームのアカウント種別（Workspace か個人か）を確認。保存国を選べない場合は「特定できない旨と理由」を記載（個人情報保護法の公表方法）",
  },
  paymentProvider: {
    label: "Stripe contracting company and its country",
    check: "Stripe の契約主体（Stripe Payments Japan 株式会社 か Stripe, Inc. か）とアカウント開設状況を確認して記入。未開設なら Stripe の記載を外すか判断",
  },
  legacyStore: {
    label: "Store of past application data",
    check: "旧サイトのガイド応募・事業者アンケートのデータが残っているか、どの事業者・国にあるかを確認。なければ第7章のこの行を削除",
  },
  effectiveDate: {
    label: "Effective date",
    check: "実際の公開日を記入（2026-11-18 経営方針）",
  },
};

/**
 * Management decisions recorded for this policy (company policy, not legal
 * review or technical verification). Decided on 2026-11-15.
 */
export const PRIVACY_DECISIONS = [
  { id: "privacyOfficer", decidedAt: "2026-11-15", decision: "Personal Information Management Officer: Soma Beppu (別府壮真), Director & Deputy Representative | EVP (取締役副代表)" },
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
  lastUpdated: "2026-11-19",
  sections: [
    {
      number: 1,
      id: "introduction",
      title: "Introduction and Data Controller",
      blocks: [
        p('Connectrip Japan Co., Ltd. (Connectrip Japan 株式会社, "Connectrip Japan", "we", "us" or "our") respects your privacy. This Privacy Policy explains how we collect, use, share and protect personal information when you visit our website, contact us, request or book our services, or apply to work with us.'),
        p("We handle personal information in accordance with the Act on the Protection of Personal Information of Japan (APPI) and other applicable Japanese laws."),
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
          "Health and similar information: we do not ask for information about your health, medical conditions or disabilities through this website, and our forms are not designed to collect it. Please do not include it in your request. If such information is needed to deliver your tour safely, we will explain why and ask for your explicit consent before we receive it. If you send it to us without being asked, we will not use it unless you give that consent, and we will delete it if you do not.",
          "Inquiries: your name, email address and the details of your question. For business inquiries, also your company or organization name, your role and your business contact details.",
          "Guide applications and interviews: your name, contact details, area of residence, age range, languages and language level, guiding experience, availability, current occupation and other information you give us in the application form or in an interview. This includes applications and partner survey answers sent through the forms on our earlier website.",
          "Messages: if you contact us by email, WhatsApp or a social media direct message, we receive your message and the contact details or account name that the service shows us.",
          "Photos and videos taken during a tour in which you appear (see Section 5).",
        ),
        h3("Payment information"),
        p("If you pay an invoice through Stripe, you enter your card or payment details on Stripe's systems, and we do not receive or store your full card number. We receive the information we need to confirm and record your payment, such as the amount, date, payment status and limited card details (for example, the card brand and last four digits)."),
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
          "to prepare, confirm and deliver your tour, including choosing a guide and contacting you before, during and after your tour;",
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
      ],
    },
    {
      number: 6,
      id: "sharing",
      title: "Sharing and Disclosure",
      blocks: [
        p("We do not sell personal information. We do not give personal information to third parties except in the cases below or where the law otherwise allows it."),
        ul(
          "Guides who deliver your tour: guides deliver tours on our behalf. We share only what a guide needs for your tour, usually your name, the date, time and meeting point, the number of people, your areas and interests, and the language. We share your phone number or messaging contact with the guide only when it is needed to reach you on the day. Because guides handle this information on our behalf, we supervise how they handle it, as the APPI requires.",
          "Service providers who work for us (see Section 7).",
          "Business transfers: if our business is merged, acquired or transferred, personal information may pass to the new owner, who must continue to protect it as described in this policy.",
          "Legal requirements and protection: where the law requires it; where it is necessary to protect someone's life, body or property and it is difficult to get your consent; or in response to lawful requests from courts, the police or other public authorities.",
          "With your consent: in any other case.",
        ),
        p("We do not share personal information with other companies for joint use."),
      ],
    },
    {
      number: 7,
      id: "service-providers",
      title: "Third-Party Service Providers",
      blocks: [
        p("We use service providers to run our business. Where they handle personal information on our behalf, they may use it only to provide their services to us, and we supervise them as the APPI requires. The table describes the services and the information involved."),
        {
          kind: "table",
          headers: ["Provider", "What they do for us", "Information involved"],
          rows: [
            ["Vercel", "Hosting this website and processing form submissions", "Technical information about your visit and the details you send through our forms"],
            ["Neon", "Database that stores booking requests and inquiries, and their handling history", "The details you enter in the booking request and inquiry forms"],
            ["Resend", "Sending an email notice to our staff when a booking request or inquiry arrives", "The details of your request, including your name and email address"],
            ["Microsoft (Microsoft 365)", "Our company mailbox (contact@connectripjapan.com): receiving and replying to email", "Your email address and the content of your messages"],
            ["Google (Google Forms)", "Guide and partner application forms", "The details you enter in those forms"],
            ["Stripe (when used for payment)", "Invoices and payments", "Your name, email address and payment information"],
            ["Neon (past application data)", "Storing guide applications and partner survey answers received through our earlier website", "The details given in those forms"],
          ],
        },
        p("Our Vercel application processing region and Neon database storage region are configured in Singapore. These settings do not describe every location where a provider or its subprocessors may process data."),
        p("If you contact us through WhatsApp, Instagram, Facebook or TikTok, those companies also handle your messages under their own privacy policies."),
      ],
    },
    {
      number: 8,
      id: "international-transfers",
      title: "International Data Transfers",
      blocks: [
        p("Some of our service providers are located outside Japan or handle data outside Japan."),
        p("We provide personal data to a third party in a foreign country, including a service provider that handles it on our behalf, only as Article 28 of the APPI permits: either with your consent, given after we have informed you of the country, its personal information protection system and the measures the recipient takes to protect personal information; or to a recipient that has established a system meeting the standards set under the APPI. In the second case, we take the necessary measures to make sure that system continues to be applied, and we give you information about those measures if you ask."),
        p("Where a provider only stores data for us and does not handle the data itself, we still protect it, taking into account the personal information protection system of the country concerned (see Section 11)."),
      ],
      pending: "【法務・公開前に必須】Vercel・Neon・Resend・Microsoft 365・Google・Stripe のそれぞれについて、(a) 当社の個人データを取り扱わない（クラウド例外）、(b) 基準適合体制（第28条第1項）、(c) 本人同意（第28条第2項） のどれに当たるかを、各社の規約・データ処理契約と個人情報保護委員会のガイドラインで確認して決める。(b) なら継続的な措置の確認と情報提供の手順を用意。(c) なら同意取得の前の情報提供が必要で、フォームの変更が要る。契約があるだけで適法とは扱わない（2026-11-18 経営方針）。",
    },
    {
      number: 9,
      id: "cookies",
      title: "Cookies and Analytics",
      blocks: [
        p("Cookies are small text files that a website stores in your browser. Similar technologies include local storage and session storage."),
        p("This website does not currently use analytics, advertising or social media tracking cookies, and does not load tools such as Google Analytics or Google Tag Manager. We do not use advertising tags."),
        p("We use your browser's session storage for one functional purpose only: to remember, while your browser tab is open, that the opening animation on our home page has already been shown. This stays in your browser, is not sent to us, and is cleared when you close the tab."),
        p("You can also block or delete cookies in your browser settings."),
      ],
    },
    {
      number: 10,
      id: "retention",
      title: "Data Retention",
      blocks: [
        p("We keep personal information only for as long as we need it for the purposes in this policy."),
        p("Where a law requires us to keep certain records, such as accounting and tax records, we keep them for the period that law requires and use them only for that reason."),
        p("When we no longer need personal information, we delete it or make it anonymous without delay."),
        p("The IP address that our booking and inquiry forms use to limit repeated submissions is kept for about 10 minutes."),
      ],
    },
    {
      number: 11,
      id: "security",
      title: "Data Security",
      blocks: [
        p("We take steps to prevent the leakage, loss or damage of personal information and to manage it safely, including:"),
        ul(
          `Organization: we have appointed a Personal Information Management Officer (${officerLine(PRIVACY_OFFICER)}), who is responsible for how we handle personal information, and we limit access to personal information to the people who need it.`,
          "Technical security: encrypted connections (HTTPS) on this website, a password-protected administration area with limits on repeated login attempts, and access controls on the services we use.",
          "Understanding the external environment: our service providers may handle or store data outside Japan. We take security measures based on an understanding of the personal information protection systems of those countries.",
        ),
        p("If a data breach is likely to harm your rights and interests, we will report it to the Personal Information Protection Commission of Japan and tell you, as the law requires."),
      ],
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

/** Content can render without pretending operational/legal checks are complete. */
export function privacyPolicyContentReady(): boolean {
  return PRIVACY_POLICY_APPROVAL !== null && privacyPolicyPlaceholders().length === 0;
}

/**
 * Separate release-readiness check. Still false until the recorded legal and
 * technical checks are actually resolved. Rendering is not deployment approval.
 */
export function privacyPolicyPublishable(): boolean {
  return (
    privacyPolicyContentReady() &&
    (PRIVACY_POLICY.sections as PolicySection[]).every((s) => !s.pending) &&
    PRIVACY_TECH_CHECKS.every((c) => c.done)
  );
}

/** The owner requested the complete policy in public mode on this PR. */
export const PRIVACY_POLICY_VISIBLE = V1_PREVIEW || privacyPolicyContentReady();

/**
 * Short notice shown next to forms before they are sent (preview only while
 * the policy is a draft). Purposes, guides, marketing.
 */
export const PRIVACY_FORM_NOTICE =
  "We use the details in this form to reply to you and, if you book, to arrange your tour. We share only what your guide needs for the day, and we never sell your information. We send marketing emails only if you ask for them.";
