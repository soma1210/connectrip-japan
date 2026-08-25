import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import { FadeIn } from "@/components/ui/FadeIn";
import { socialLinks } from "@/data/social-links";
import { cn } from "@/lib/cn";

const ICONS = {
  tiktok: FaTiktok,
  instagram: FaInstagram,
  facebook: FaFacebookF,
  whatsapp: FaWhatsapp,
} as const;

const ICON_BACKGROUNDS = {
  tiktok: "bg-black",
  instagram: "bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#4F5BD5]",
  facebook: "bg-[#1877F2]",
  whatsapp: "bg-[#25D366]",
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
    <FadeIn delay={delay} className="h-full">
      <a
        href={socialLinks[platform]}
        target="_blank"
        rel="noreferrer noopener"
        className="group flex h-full flex-col items-center gap-2 overflow-hidden bg-cream px-2 py-6 text-center text-navy transition-opacity hover:opacity-90 @container sm:gap-3 sm:px-6 sm:py-8"
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full text-white h-[clamp(1.75rem,14cqw,3.5rem)] w-[clamp(1.75rem,14cqw,3.5rem)]",
            ICON_BACKGROUNDS[platform],
          )}
        >
          <Icon className="h-[clamp(0.875rem,6cqw,1.5rem)] w-[clamp(0.875rem,6cqw,1.5rem)]" />
        </span>
        <p className="w-full truncate text-[clamp(0.7rem,5cqw,1.125rem)]">{label}</p>
        <p className="w-full truncate text-[clamp(0.55rem,3.6cqw,0.75rem)] text-navy/60">{handle}</p>
        <span className="mt-1 w-full truncate text-[clamp(0.55rem,3.4cqw,0.75rem)] tracking-[0.08em] text-[#7f9dbd] transition-colors group-hover:text-navy">
          &rarr; {follow}
        </span>
      </a>
    </FadeIn>
  );
}
