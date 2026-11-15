/**
 * Website v1 data (single source of truth, 2026-11-15). Moved here from the
 * retired legacy site's messages/*.json, unchanged in wording.
 * Home SNS section copy (Japanese).
 */
export const SNS_COPY_JA = {
  "heading": "SNS",
  "subheading": "最新の旅情報やお得な情報をSNSでも配信中です。ぜひフォローしてください。",
  "follow": "FOLLOW US",
  "items": [
    {
      "platform": "tiktok",
      "label": "TikTok",
      "handle": "@japan_tavel_guide_ctj"
    },
    {
      "platform": "instagram",
      "label": "Instagram",
      "handle": "@japan_tavel_guide_ctj"
    },
    {
      "platform": "facebook",
      "label": "Facebook",
      "handle": "@japan_tavel_guide_ctj"
    },
    {
      "platform": "whatsapp",
      "label": "WhatsApp",
      "handle": "+81-90-8269-1398"
    }
  ]
};

/**
 * Home SNS section copy (English).
 */
export const SNS_COPY_EN = {
  "heading": "SNS",
  "subheading": "Follow us for the latest travel tips and updates on social media.",
  "follow": "FOLLOW US",
  "items": [
    {
      "platform": "tiktok",
      "label": "TikTok",
      "handle": "@japan_tavel_guide_ctj"
    },
    {
      "platform": "instagram",
      "label": "Instagram",
      "handle": "@japan_tavel_guide_ctj"
    },
    {
      "platform": "facebook",
      "label": "Facebook",
      "handle": "@japan_tavel_guide_ctj"
    },
    {
      "platform": "whatsapp",
      "label": "WhatsApp",
      "handle": "+81-90-8269-1398"
    }
  ]
};

/**
 * Home SNS slide (minimal redesign, 2026-11-15): heading and one short line
 * per account, taken from the approved reference design. Links are NOT here:
 * they stay in `socialLinks` (src/data/social-links.ts), shared with the footer.
 */
export const SNS_SLIDE_COPY = {
  eyebrow: "Follow Connectrip Japan",
  heading: "Follow Our Journey",
  tagline: "Discover Kansai through our stories, travel tips, and local experiences.",
  accounts: {
    tiktok: { description: "Short travel videos & highlights", action: "Follow on TikTok", short: "Follow" },
    instagram: { description: "Travel photos, reels & updates", action: "Follow on Instagram", short: "Follow" },
    facebook: { description: "Travel news & useful information", action: "Follow on Facebook", short: "Follow" },
    whatsapp: { description: "Message us directly", action: "Chat on WhatsApp", short: "Chat" },
  },
} as const;
