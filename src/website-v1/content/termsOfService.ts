import type { LegalSection } from "@/contracts";

/**
 * Terms of Service (Human instruction 2026-11-18): the owner's final text,
 * shown on the Terms & Conditions page (`/terms`). Wording is the owner's;
 * do not edit it here without a new instruction.
 *
 * A section with an empty heading is shown as plain paragraphs (the
 * introduction and the closing company name).
 */
export const TERMS_SOURCE = "Terms of Service text (Human instruction 2026-11-18)";

export const TERMS_TITLE = "Terms of Service";
export const TERMS_UPDATED_AT = "November 18, 2026";

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: "",
    paragraphs: [
      "These Terms of Service (“Terms”) govern the use of the official website operated by Connectrip Japan Co., Ltd. (“Company,” “we,” “us,” or “our”) and the services we provide.",
      "Please read these Terms carefully before using our website or services.",
    ],
  },
  {
    heading: "Article 1. Scope",
    paragraphs: [
      "These Terms apply to all users who access our website, submit inquiries, make service reservations, or use our services.",
    ],
  },
  {
    heading: "Article 2. Our Services",
    paragraphs: [
      "We provide private guide services, walking tours, sightseeing guidance, local information, and other related services.",
      "Our services primarily consist of guided experiences and information provided by our guides. We do not provide travel agency services that require registration under Japan’s Travel Agency Act.",
    ],
  },
  {
    heading: "Article 3. Reservations and Bookings",
    paragraphs: [
      "1. Reservations may be requested through our website or other communication channels designated by the Company.",
      "2. Submitting a booking request does not constitute a confirmed reservation.",
      "3. A reservation is confirmed only after the Company reviews the request and sends an official booking confirmation.",
      "4. Service details, prices, schedules, and other relevant conditions will be provided during the booking process.",
    ],
  },
  {
    heading: "Article 4. Pricing and Cancellations",
    paragraphs: [
      "1. Service fees and payment methods are subject to the conditions provided at the time of booking.",
      "2. Cancellations and refunds are subject to the cancellation policy communicated during the booking process.",
      "3. Transportation, meals, admission fees, and other personal expenses are the responsibility of the customer unless otherwise specified.",
    ],
  },
  {
    heading: "Article 5. Prohibited Activities",
    paragraphs: [
      "Users must not engage in any of the following activities:",
      "1. Violating applicable laws or public order.",
      "2. Infringing upon the rights of the Company or third parties.",
      "3. Providing false or misleading information.",
      "4. Interfering with the operation of our website or services.",
      "5. Engaging in any other activities that the Company reasonably considers inappropriate.",
    ],
  },
  {
    heading: "Article 6. Changes and Cancellations of Services",
    paragraphs: [
      "We may modify or cancel services due to weather conditions, natural disasters, safety concerns, or other unavoidable circumstances.",
      "In such cases, we will make reasonable efforts to notify customers promptly and respond in accordance with applicable contractual terms and laws.",
    ],
  },
  {
    heading: "Article 7. Disclaimer and Liability",
    paragraphs: [
      "We strive to ensure that the information provided on our website is accurate and up to date. However, we do not guarantee the accuracy or completeness of all information.",
      "We are responsible for damages caused by our intentional misconduct or negligence in accordance with applicable laws.",
    ],
  },
  {
    heading: "Article 8. Intellectual Property Rights",
    paragraphs: [
      "All content on our website, including text, photographs, videos, logos, designs, and other materials, is owned by the Company or its respective rights holders.",
      "Unauthorized reproduction, distribution, or commercial use of such content is prohibited, except as permitted by applicable law or with the permission of the relevant rights holder.",
    ],
  },
  {
    heading: "Article 9. Privacy and Personal Information",
    paragraphs: ["We handle personal information in accordance with applicable data protection laws and our Privacy Policy."],
  },
  {
    heading: "Article 10. Changes to These Terms",
    paragraphs: [
      "We may update or modify these Terms when necessary, in accordance with applicable laws.",
      "Any changes and their effective dates will be announced on our website or through other appropriate means.",
    ],
  },
  {
    heading: "Article 11. Governing Law and Jurisdiction",
    paragraphs: [
      "These Terms shall be governed by and interpreted in accordance with the laws of Japan.",
      "Any disputes arising in connection with these Terms shall, to the extent permitted by applicable law, be subject to the agreed jurisdiction of the Osaka District Court or the Osaka Summary Court as the court of first instance.",
    ],
  },
  {
    heading: "Article 12. Contact Information",
    paragraphs: [
      "For questions or inquiries regarding these Terms, please contact us:",
      "Company Name: Connectrip Japan Co., Ltd.",
      "Website: connectripjapan.com",
      "Email: contact@connectripjapan.com",
    ],
  },
  { heading: "", paragraphs: ["Connectrip Japan Co., Ltd."] },
];
