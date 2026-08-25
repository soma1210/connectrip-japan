import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import { FadeIn } from "@/components/ui/FadeIn";
import { socialLinks } from "@/data/social-links";

const ICONS = {
  tiktok: FaTiktok,
  instagram: FaInstagram,
  facebook: FaFacebookF,
  whatsapp: FaWhatsapp,
} as const;

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

  return (
    <FadeIn delay={delay}>
      <a
        href={socialLinks[platform]}
        target="_blank"
        rel="noreferrer noopener"
        className="group flex h-full flex-col items-center gap-3 bg-cream p-8 text-center text-navy transition-opacity hover:opacity-90"
      >
        <Icon className="h-7 w-7 text-navy" />
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-navy/60">{handle}</p>
        <span className="mt-1 text-xs tracking-[0.08em] text-red transition-colors group-hover:text-navy">
          &rarr; {follow}
        </span>
      </a>
    </FadeIn>
  );
}
