import type { SocialProofContent } from "@/contracts";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { SectionTitle, TbdBlock } from "../components/Blocks";

/**
 * Social Proof. Only human-verified reviews / metrics with a source can reach
 * this component (enforced by the contract types). Until then: TBD states.
 */
export function SocialProofBlock({ content }: { content: SocialProofContent }) {
  return (
    <>
      <SectionTitle heading={content.heading} slot="Social Proof" />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-3">
          <p className="font-heading-en text-xs tracking-[0.15em] text-cream/50 italic">REVIEWS</p>
          {content.reviews.status === "TBD" ? (
            <TbdBlock value={content.reviews} slot="Verified reviews" />
          ) : (
            content.reviews.value.map((review) => (
              <figure key={review.id} className="border border-gold/30 bg-navy-dark/40 p-5">
                <blockquote className="text-sm leading-relaxed text-cream/85">“{review.quote}”</blockquote>
                <figcaption className="mt-3 text-xs text-cream/60">
                  {review.author.displayName}
                  {review.author.country ? `, ${review.author.country}` : ""} ·{" "}
                  {review.source.url ? (
                    <a href={review.source.url} className="underline hover:text-gold" target="_blank" rel="noreferrer noopener">
                      {review.source.platform}
                    </a>
                  ) : (
                    review.source.platform
                  )}
                </figcaption>
              </figure>
            ))
          )}
        </div>

        <div className="flex flex-col gap-3">
          <p className="font-heading-en text-xs tracking-[0.15em] text-cream/50 italic">PHOTOS</p>
          {content.photos.status === "TBD" ? (
            <TbdBlock value={content.photos} slot="Real photos" />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {content.photos.value.map((photo) => (
                <div key={photo.src} className="relative aspect-square overflow-hidden border border-gold/30">
                  <PlaceholderImage src={photo.src} alt={photo.alt} sizes="20vw" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <p className="font-heading-en text-xs tracking-[0.15em] text-cream/50 italic">SNS</p>
          {content.social.status === "TBD" ? (
            <TbdBlock value={content.social} slot="SNS accounts" />
          ) : (
            content.social.value.map((link) => (
              <a key={link.platform} href={link.href} className="text-sm text-cream/80 hover:text-gold" target="_blank" rel="noreferrer noopener">
                {link.platform}
              </a>
            ))
          )}
          {content.metrics && content.metrics.status === "TBD" ? <TbdBlock value={content.metrics} slot="Verified SNS metrics" /> : null}
        </div>
      </div>
    </>
  );
}
