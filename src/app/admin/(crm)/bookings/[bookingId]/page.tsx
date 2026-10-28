import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BookingDetailView } from "@/admin/components/BookingDetailView";
import { getAdminBookingDetail } from "@/admin/customers/readModel";
import { isAdminAuthenticated } from "@/lib/admin-auth";

type Props = { params: Promise<{ bookingId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!(await isAdminAuthenticated())) {
    return { title: "Connectrip Admin", robots: { index: false, follow: false } };
  }
  const { bookingId } = await params;
  const booking = await getAdminBookingDetail(bookingId);
  return {
    title: booking ? `${booking.overview.bookingId} · Connectrip Admin` : "Booking · Connectrip Admin",
    robots: { index: false, follow: false },
  };
}

export default async function BookingDetailPage({ params }: Props) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const { bookingId } = await params;
  const booking = await getAdminBookingDetail(bookingId);
  if (!booking) notFound();
  return <BookingDetailView booking={booking} />;
}
