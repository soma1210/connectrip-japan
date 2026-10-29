import { getApplicantView, type ApplicantView } from "@/lib/interviews";
import { BookingFlow } from "@/components/interview/BookingFlow";
import { InterviewStatus } from "@/components/interview/InterviewStatus";

/**
 * Applicant interview booking page. The token in the URL identifies the
 * applicant's invitation; it is checked here and again by every API call.
 */
export default async function InterviewBookingPage({ params }: PageProps<"/interview/[token]">) {
  const { token } = await params;

  let view: ApplicantView | null = null;
  try {
    view = await getApplicantView(token);
  } catch (error) {
    console.error("[interviews] booking page failed to load", error);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-[0.2em] text-gold">CONNECTRIP JAPAN</p>
        <h1 className="text-2xl font-semibold">Guide Interview</h1>
      </header>

      {view === null ? (
        <InterviewStatus state="unavailable" />
      ) : view.state === "choose" ? (
        <BookingFlow token={token} name={view.name} />
      ) : view.state === "requested" || view.state === "confirmed" ? (
        <InterviewStatus state={view.state} start={view.start} end={view.end} />
      ) : (
        <InterviewStatus state={view.state} />
      )}
    </main>
  );
}
