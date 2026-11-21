import type { HomeSectionKey, HomeViewModel } from "@/contracts";
import { V1_PREVIEW } from "../config";
import { getExploreHomeSlides } from "../content/explore/home";
import { KANSAI_PREFECTURES } from "../content/prefectures";
import { PLAN_AREAS, PLAN_DURATIONS, PLAN_INTERESTS, PLAN_STYLES } from "../booking/privateDayPlan";
import { ACTIVITY_LABELS, AREA_LABELS } from "../content/privateGuide";
import { textOr } from "../components/Tbd";
import { ExploreKansaiSlides } from "../components/explore/ExploreKansaiSlides";
import { PhilosophySection } from "../components/globe/PhilosophySection";
import { PrefectureScene } from "../components/wd/PrefectureScene";
import { AwardHero } from "../components/award/AwardHero";
import { AwardLoader } from "../components/award/AwardLoader";
import { AwardMotion } from "../components/award/AwardMotion";
import { FeatureSpread } from "../components/award/FeatureSpread";
import { PortalCta } from "../components/award/PortalCta";
import { PlaceMarquee } from "../components/award/PlaceMarquee";
import { TRAIL_EXTRA_IMAGES } from "../assets/trailImages";
import { SnsSlide } from "../components/sns/SnsSlide";
import { KatomadoDefs } from "../components/award/Split";
import { StepTrack } from "../components/award/StepTrack";
import { TypeWindow } from "../components/award/TypeWindow";
import { ValueStack } from "../components/award/ValueStack";

/** Not shown in public mode (launch scope 2026-11-11), as before. */
const PREVIEW_ONLY: ReadonlySet<HomeSectionKey> = new Set(["featuredExperiences", "howItWorks", "travelGuide"]);
const ORDER: HomeSectionKey[] = ["hero", "featuredExperiences", "privateGuide", "howItWorks", "travelGuide", "whyConnectrip", "sns", "finalCta"];

/**
 * Award Home (2026-11-22, built from scratch; the previous Home is
 * views/HomeView.tsx, kept for reference). One motif throughout: the katomado,
 * a temple window — photos appear through it and it opens into each scene.
 * Same content and photos as before (content/home.ts and friends).
 */
export function AwardHomeView({ vm }: { vm: HomeViewModel }) {
  const c = vm.content;
  const order = c.sectionOrder.status === "TBD" ? ORDER : c.sectionOrder.value;
  const photos = c.hero.images.status === "TBD" ? [] : c.hero.images.value;
  const options = [
    { label: "DESTINATIONS", items: PLAN_AREAS.map((k) => textOr(AREA_LABELS[k], k)) },
    { label: "EXPERIENCES", items: PLAN_INTERESTS.map((k) => textOr(ACTIVITY_LABELS[k], k)) },
    { label: "DURATION", items: PLAN_DURATIONS.map((d) => d.label) },
    { label: "TRAVEL STYLE", items: PLAN_STYLES.map((s) => s.label) },
  ];

  const sections: Partial<Record<HomeSectionKey, React.ReactNode>> = {
    hero: <AwardHero hero={c.hero} />,
    featuredExperiences: (
      <>
        <FeatureSpread section={c.featuredExperiences} />
        <PrefectureScene id="kansai-prefectures" prefectures={KANSAI_PREFECTURES} />
      </>
    ),
    privateGuide: (
      <>
        <TypeWindow section={c.privateGuide} options={options} />
        {/* A band of the six prefectures between the private day and how it works. */}
        <PlaceMarquee names={KANSAI_PREFECTURES.map((p) => ({ name: p.name, kanji: p.kanji }))} />
      </>
    ),
    howItWorks: c.howItWorks.heading.status === "TBD" ? null : <StepTrack id="how-it-works" heading={c.howItWorks.heading.value} flows={c.howItWorks.flows} />,
    travelGuide: <ExploreKansaiSlides data={getExploreHomeSlides()} id="explore-kansai" />,
    whyConnectrip: <ValueStack id="value" section={c.whyConnectrip} />,
    // SNS: the earlier card design (Human instruction 2026-11-22), with its fly-in motion.
    sns: c.sns ? <SnsSlide accounts={c.sns.accounts.map((a) => ({ platform: a.platform, label: textOr(a.label, ""), href: a.href }))} /> : null,
    finalCta: <PortalCta section={c.finalCta} trail={[...photos.map((p) => p.src), ...TRAIL_EXTRA_IMAGES]} />,
  };

  return (
    <div id="award-home">
      <KatomadoDefs />
      <AwardLoader photos={photos} />
      {order.map((key) => (sections[key] && (V1_PREVIEW || !PREVIEW_ONLY.has(key)) ? <div key={key}>{sections[key]}</div> : null))}
      <PhilosophySection />
      <AwardMotion rootId="award-home" />
    </div>
  );
}
