import { useTranslations } from "next-intl";
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { socialLinks } from "@/data/social-links";
import { LanguageSwitch } from "./LanguageSwitch";

const SNS_ICONS = {
  tiktok: FaTiktok,
  instagram: FaInstagram,
  whatsapp: FaWhatsapp,
  facebook: FaFacebookF,
} as const;

const FOOTER_NAV = [
  { key: "service", href: "#service" },
  { key: "process", href: "#process" },
  { key: "plan", href: "#plan" },
  { key: "reservation", href: "/reservation" },
  { key: "contact", href: "#contact" },
] as const;

const INFORMATION_LINKS: Record<string, string> = {
  company: "/company",
  cancellation: "/cancel-policy",
};

const INFORMATION_KEYS = [
  "careers",
  "company",
  "cancellation",
  "terms",
  "businessInquiry",
] as const;

export function Footer() {
  const t = useTranslations("footer");
  const th = useTranslations("header");

  return (
    <footer className="border-t border-dashed border-gold/30 bg-navy-dark">
      <Container className="grid gap-12 py-16 md:grid-cols-3 md:gap-8">
        <div>
          <div className="flex flex-col leading-none">
            <span className="font-heading-en text-lg tracking-[0.12em] text-cream">
              {th("logoLine1")}
            </span>
            <span className="font-heading-en text-lg tracking-[0.12em] text-cream">
              {th("logoLine2")}
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-cream/60">{t("tagline")}</p>
          <LanguageSwitch variant="boxed" className="mt-6" />
          <div className="mt-4 flex flex-wrap gap-3">
            {(["tiktok", "instagram", "whatsapp", "facebook"] as const).map(
              (platform) => {
                const Icon = SNS_ICONS[platform];
                return (
                  <a
                    key={platform}
                    href={socialLinks[platform]}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex h-9 w-9 items-center justify-center border border-cream/20 text-cream/70 transition-colors hover:border-gold hover:text-gold"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              },
            )}
          </div>
        </div>

        <div>
          <p className="font-heading-en text-xs tracking-[0.15em] text-cream/50 italic">
            {t("navigationHeading")}
          </p>
          <nav className="mt-4 flex flex-col gap-3">
            {FOOTER_NAV.map((item) =>
              item.href.startsWith("#") ? (
                <a
                  key={item.key}
                  href={item.href}
                  className="text-sm text-cream/70 transition-colors hover:text-gold"
                >
                  {t(`nav.${item.key}`)}
                </a>
              ) : (
                <Link
                  key={item.key}
                  href={item.href}
                  className="text-sm text-cream/70 transition-colors hover:text-gold"
                >
                  {t(`nav.${item.key}`)}
                </Link>
              ),
            )}
          </nav>
        </div>

        <div>
          <p className="font-heading-en text-xs tracking-[0.15em] text-cream/50 italic">
            {t("informationHeading")}
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {INFORMATION_KEYS.map((key) => {
              const href = INFORMATION_LINKS[key];
              if (href) {
                return (
                  <Link
                    key={key}
                    href={href}
                    className="text-sm text-cream/70 transition-colors hover:text-gold"
                  >
                    {t(`information.${key}`)}
                  </Link>
                );
              }
              return (
                <span key={key} className="text-sm text-cream/50">
                  {t(`information.${key}`)}
                </span>
              );
            })}
          </div>
        </div>
      </Container>

      <Container className="flex flex-col gap-2 border-t border-cream/10 py-6 text-xs text-cream/40 md:flex-row md:items-center md:justify-between">
        <span>
          &copy; {new Date().getFullYear()} {t("copyright")}
        </span>
        <span className="font-heading-en tracking-[0.1em]">
          CONNECTRIP JAPAN
        </span>
      </Container>
    </footer>
  );
}
