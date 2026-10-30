import { GUIDE_APPLICATION_FORM_URL } from "@/features/guide-interviews/site";

// Public explainer for the guide interview. Styling follows the applicant
// booking page (BookingShell, interview-ui.css). No availability is shown
// here: only invited applicants book, through their personal link.

// Absolute links: this page is served from the interview-only site, which does
// not serve /guide-community or the main site's contact page. Revisit when the
// page moves to connectripjapan.com.
const APPLY_HREF = GUIDE_APPLICATION_FORM_URL;
const CONTACT_HREF = "mailto:contact@connectripjapan.com";

const OVERVIEW = [
  { label: "Format", value: "Online interview" },
  { label: "Length", value: "About 30 minutes" },
  { label: "Where", value: "Google Meet" },
  { label: "Experience", value: "No guiding experience required" },
  { label: "Area", value: "For people who can guide in Kansai" },
];

const STEPS = [
  { title: "Apply", body: "Fill out the guide application form. It takes about 3–5 minutes." },
  { title: "Application review", body: "Our team reads your application." },
  { title: "Interview invitation", body: "If we would like to meet you, we email you a personal booking link." },
  {
    title: "Choose a date",
    body: "Pick a time on your personal booking page. Your interview is confirmed once we approve it, and we email you the Google Meet link.",
  },
  { title: "Interview", body: "A relaxed 30-minute conversation online, so we can get to know each other." },
];

export default function GuideInterviewPage() {
  return (
    <main className="interview-ui interview-applicant mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-10 px-4 py-8 sm:gap-14 sm:px-8 sm:py-14">
      {/* Hero */}
      <header className="border-b border-navy/15 pb-8 sm:pb-10">
        <p className="text-xs font-semibold tracking-[0.2em] text-navy">
          CONNECTRIP <span className="text-[#896a30]">JAPAN</span>
        </p>
        <div className="mt-5 h-0.5 w-10 bg-gold" aria-hidden="true" />
        <h1 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">Guide Interview</h1>
        <p className="mt-3 text-lg text-navy/80 sm:text-xl">Join our guide community in Kansai</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a href={APPLY_HREF} className="interview-primary inline-flex items-center justify-center">
            Apply as a Guide
          </a>
          <a href="#already-invited" className="interview-secondary inline-flex items-center justify-center bg-white">
            Already invited? Check your interview booking link
          </a>
        </div>
      </header>

      {/* Overview */}
      <section aria-labelledby="overview-heading" className="rounded-xl border border-navy/15 border-t-[3px] border-t-gold bg-white p-6 shadow-sm sm:p-8">
        <h2 id="overview-heading" className="font-serif text-2xl leading-snug sm:text-3xl">About the interview</h2>
        <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {OVERVIEW.map((item) => (
            <div key={item.label} className="rounded-lg bg-cream px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wider text-navy/70">{item.label}</dt>
              <dd className="mt-1 font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Flow */}
      <section aria-labelledby="flow-heading">
        <h2 id="flow-heading" className="font-serif text-2xl leading-snug sm:text-3xl">How it works</h2>
        <ol className="mt-6 flex flex-col">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
              {index < STEPS.length - 1 ? (
                <span aria-hidden="true" className="absolute left-5 top-11 bottom-1 w-px bg-gold/60" />
              ) : null}
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
                {index + 1}
              </span>
              <div className="flex flex-col gap-1 pt-1.5">
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-navy/75">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Apply */}
      <section aria-labelledby="apply-heading" className="rounded-xl bg-navy p-6 text-white shadow-sm sm:p-8">
        <h2 id="apply-heading" className="font-serif text-2xl leading-snug sm:text-3xl">Ready to apply?</h2>
        <p className="mt-3 text-sm text-white/80">
          Start with the guide application form. We will contact you by email about the next steps.
        </p>
        <a
          href={APPLY_HREF}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-navy hover:bg-gold/90 sm:w-auto"
        >
          Apply as a Guide
        </a>
      </section>

      {/* Already invited */}
      <section
        id="already-invited"
        aria-labelledby="invited-heading"
        className="scroll-mt-6 rounded-xl border border-navy/15 bg-white p-6 shadow-sm sm:p-8"
      >
        <h2 id="invited-heading" className="font-serif text-2xl leading-snug sm:text-3xl">Already invited?</h2>
        <div className="mt-4 flex flex-col gap-3 text-sm text-navy/80">
          <p>
            If you have received an interview invitation, please use the personal booking link in the email from
            Connectrip Japan. Interview times can only be booked through that link.
          </p>
          <p>Booking links are personal and stay valid for 14 days. Please do not share yours with anyone.</p>
          <p>
            If your link has expired or you cannot find the email, please email us at{" "}
            <a href={CONTACT_HREF} className="font-medium text-navy underline underline-offset-2 hover:text-navy/70">
              contact@connectripjapan.com
            </a>{" "}
            and we will send you a new one.
          </p>
        </div>
      </section>

      <footer className="text-center text-xs text-navy/70">Connectrip Japan · Guide recruitment</footer>
    </main>
  );
}
