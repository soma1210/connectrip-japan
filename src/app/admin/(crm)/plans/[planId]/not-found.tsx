import Link from "next/link";

export default function PlanNotFound() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Private day plan not found</h1>
      <p className="text-sm text-slate-600">That plan ID is not in the prototype data.</p>
      <Link href="/admin/plans" className="text-sm text-navy underline-offset-2 hover:underline">
        Back to private day plans
      </Link>
    </div>
  );
}
