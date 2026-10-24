import type { GuideArticleGroup } from "@/contracts";
import { cn } from "@/lib/cn";
import { ArticleCard } from "../Cards";
import { TbdText } from "../Tbd";

/**
 * "Latest in Osaka" / "Explore Osaka" card group (Hub, Home, related
 * articles). Empty groups show their note when `showEmpty`, otherwise render
 * nothing. `mobileMax` hides extra cards below `md` to keep Home light.
 */
export function ArticleGroup({
  group,
  showEmpty = false,
  mobileMax,
  headingAs: Heading = "h2",
}: {
  group: GuideArticleGroup;
  showEmpty?: boolean;
  mobileMax?: number;
  headingAs?: "h2" | "h3";
}) {
  if (group.articles.length === 0 && !showEmpty) return null;
  const id = `guide-group-${group.key}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-6">
      <div>
        <Heading id={id} className="font-heading-en text-sm tracking-[0.3em] text-gold uppercase">
          <TbdText value={group.heading} slot="Group heading" />
        </Heading>
        {group.supporting ? (
          <TbdText value={group.supporting} slot="Group note" as="p" className="mt-2 text-xs text-cream/55" />
        ) : null}
      </div>
      {group.articles.length === 0 ? (
        group.emptyNote ? (
          <TbdText
            value={group.emptyNote}
            slot="Empty note"
            as="p"
            className="border border-dashed border-gold/25 px-5 py-6 text-sm text-cream/60"
          />
        ) : null
      ) : (
        <div className="grid gap-10 md:grid-cols-3">
          {group.articles.map((item, i) => (
            <div key={item.id} className={cn("flex flex-col", mobileMax !== undefined && i >= mobileMax && "hidden md:flex")}>
              <ArticleCard item={item} delay={i * 0.1} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
