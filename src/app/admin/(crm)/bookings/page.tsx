import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingsList } from "@/admin/components/BookingsList";
import { getAdminBookingList } from "@/admin/customers/readModel";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Bookings · Connectrip Admin",
  robots: { index: false, follow: false },
};

export default async function BookingsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const bookings = await getAdminBookingList();
  return <BookingsList bookings={bookings} />;
}
