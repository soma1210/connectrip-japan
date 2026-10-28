import Link from "next/link";

export default function CustomerNotFound() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Customer not found</h1>
      <p className="text-sm text-slate-600">That customer ID is not in the prototype data.</p>
      <Link href="/admin/customers" className="text-sm text-navy underline-offset-2 hover:underline">
        Back to customers
      </Link>
    </div>
  );
}
