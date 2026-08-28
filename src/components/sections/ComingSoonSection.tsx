import { Container } from "@/components/ui/Container";
import { LegalPageHeader } from "@/components/ui/LegalPageHeader";
import { FadeIn } from "@/components/ui/FadeIn";

export function ComingSoonSection({
  heading,
  subheading,
  message,
}: {
  heading: string;
  subheading: string;
  message: string;
}) {
  return (
    <div className="bg-cream py-[60px] text-navy md:py-[100px]">
      <Container className="max-w-3xl">
        <LegalPageHeader heading={heading} subheading={subheading} />
        <FadeIn delay={0.1}>
          <p className="whitespace-pre-line text-sm leading-loose text-navy/80">
            {message}
          </p>
        </FadeIn>
      </Container>
    </div>
  );
}
