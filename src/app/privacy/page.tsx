import type { ReactNode } from "react";
import Link from "next/link";

// Privacy policy for the guide interview booking system only (the main
// website has its own pages). Styling follows /guide-interview.

const CONTACT_EMAIL = "contact@connectripjapan.com";
const EFFECTIVE_DATE = "October 30, 2026";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="font-serif text-xl leading-snug sm:text-2xl">
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-navy/80">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="interview-ui interview-applicant mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-10 px-4 py-8 sm:px-8 sm:py-14">
      <header className="border-b border-navy/15 pb-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-navy">
          CONNECTRIP <span className="text-[#896a30]">JAPAN</span>
        </p>
        <div className="mt-5 h-0.5 w-10 bg-gold" aria-hidden="true" />
        <h1 className="mt-4 font-serif text-3xl tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-navy/75">Guide application and interview booking · Effective {EFFECTIVE_DATE}</p>
      </header>

      <div className="flex flex-col gap-8 rounded-xl border border-navy/15 border-t-[3px] border-t-gold bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm leading-relaxed text-navy/80">
          This policy explains how Connectrip Japan (&ldquo;we&rdquo;) handles personal information in our guide
          application and interview booking system, including the interview pages on this site. It covers only this
          system.
        </p>

        <Section id="collect" title="Information we collect">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Your name</li>
            <li>Your email address</li>
            <li>
              Guide application information you submit in the application form, such as your area, languages,
              experience and availability
            </li>
            <li>
              Interview booking information: the date and time you request, the status of your request, and the
              Google Meet link for an approved interview
            </li>
          </ul>
        </Section>

        <Section id="use" title="How we use it">
          <p>We use this information only to:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>review your guide application</li>
            <li>schedule your interview</li>
            <li>communicate with you about your application and interview</li>
          </ul>
        </Section>

        <Section id="google" title="Google Calendar and Google Meet">
          <p>
            Interview times are offered from our interviewer&rsquo;s Google Calendar, which we connect with Google
            OAuth. We use it as follows:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              We read free/busy information only (when the calendar is busy) to decide which times can be booked. We
              do not read the titles, descriptions, locations or attendees of calendar events.
            </li>
            <li>Applicants never see the content of our calendar, only the times that are available.</li>
            <li>
              When we approve an interview, we create a Google Calendar event and a Google Meet link for that
              interview. We send the Meet link to you by email. You are not added to the event as an attendee.
            </li>
          </ul>
          <p>
            Our use of information received from Google APIs adheres to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              className="font-medium text-navy underline underline-offset-2 hover:text-navy/70"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </Section>

        <Section id="share" title="Sharing">
          <p>We do not sell your personal information or use it for advertising.</p>
          <p>
            We use service providers only as needed to run this system: Google (Calendar and Meet), our email
            provider (to send emails about your application and interview), and our hosting and database providers
            (to run this site and store your information).
          </p>
        </Section>

        <Section id="cookies" title="Cookies">
          <p>
            These interview pages do not use advertising or analytics cookies. The admin area uses a cookie only to
            keep our staff signed in.
          </p>
        </Section>

        <Section id="rights" title="Your choices">
          <p>
            You can ask us to show, correct or delete the personal information we hold about you by contacting us at
            the address below.
          </p>
        </Section>

        <Section id="contact" title="Contact">
          <p>
            Questions about this policy or your information:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-navy underline underline-offset-2 hover:text-navy/70">
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>
      </div>

      <footer className="flex flex-col items-center gap-2 text-center text-xs text-navy/70">
        <Link href="/guide-interview" className="underline underline-offset-2 hover:text-navy">
          Guide Interview
        </Link>
        <span>Connectrip Japan · Guide recruitment</span>
      </footer>
    </main>
  );
}
