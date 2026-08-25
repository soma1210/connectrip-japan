import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import { FadeIn } from "@/components/ui/FadeIn";
import { socialLinks } from "@/data/social-links";

const ICONS = {
  tiktok: FaTiktok,
  instagram: FaInstagram,
  facebook: FaFacebookF,
  whatsapp: FaWhatsapp,
} as const;

// Facebook/WhatsApp don't have a confirmed destination yet, so their "FOLLOW US"
// link keeps deriving a best-guess URL from the handle, same as before.
function followHref(platform: keyof typeof ICONS, handle: string) {
  const username = handle.replace(/^@/, "");
  switch (platform) {
    case "tiktok":
      return `https://www.tiktok.com/@${username}`;
    case "instagram":
      return `https://www.instagram.com/${username}`;
    case "facebook":
      return `https://www.facebook.com/${username}`;
    case "whatsapp":
      return `https://wa.me/${handle.replace(/[^0-9]/g, "")}`;
  }
}

const cardClassName =
  "flex h-full flex-col items-center gap-3 bg-cream p-8 text-center text-navy";

export function SnsCard({
  platform,
  label,
  handle,
  follow,
  delay = 0,
}: {
  platform: keyof typeof ICONS;
  label: string;
  handle: string;
  follow: string;
  delay?: number;
}) {
  const Icon = ICONS[platform];
  const confirmedHref =
    platform === "tiktok" || platform === "instagram"
      ? socialLinks[platform]
      : undefined;

  const content = (
    <>
      <Icon className="h-7 w-7 text-navy" />
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-navy/60">{handle}</p>
      {confirmedHref ? (
        <span className="mt-1 text-xs tracking-[0.08em] text-red transition-colors group-hover:text-navy">
          &rarr; {follow}
        </span>
      ) : (
        <a
          href={followHref(platform, handle)}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-1 text-xs tracking-[0.08em] text-red transition-colors hover:text-navy"
        >
          &rarr; {follow}
        </a>
      )}
    </>
  );

  if (confirmedHref) {
    return (
      <FadeIn delay={delay}>
        <a
          href={confirmedHref}
          target="_blank"
          rel="noreferrer noopener"
          className={`${cardClassName} group transition-opacity hover:opacity-90`}
        >
          {content}
        </a>
      </FadeIn>
    );
  }

  return (
    <FadeIn delay={delay} className={cardClassName}>
      {content}
    </FadeIn>
  );
}
