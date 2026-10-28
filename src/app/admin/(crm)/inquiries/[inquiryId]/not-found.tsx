import Link from "next/link";

export default function InquiryNotFound() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Inquiry not found</h1>
      <p className="text-sm text-slate-600">That inquiry ID is not in the prototype data.</p>
      <Link href="/admin/inquiries" className="text-sm text-navy underline-offset-2 hover:underline">
        Back to inquiries
      </Link>
    </div>
  );
}
