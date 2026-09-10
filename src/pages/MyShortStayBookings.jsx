import { useEffect, useState } from "react";
import { getMyShortStayBookings, cancelShortStayBooking, formatDate, formatKsh, firstImage, cloudImg, todayISO } from "../lib/shortStayUtils";

const TABS = ["upcoming", "active", "completed", "cancelled"];

const BADGES = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending_payment: "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-600",
  expired: "bg-red-100 text-red-600",
};

export default function MyShortStayBookings() {
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const today = todayISO();

  useEffect(() => {
    getMyShortStayBookings()
      .then(setBookings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const buckets = {
    upcoming:  bookings.filter((b) => b.status === "confirmed" && b.check_in_date > today),
    active:    bookings.filter((b) => b.status === "confirmed" && b.check_in_date <= today && b.check_out_date > today),
    completed: bookings.filter((b) => b.status === "completed" || (b.status === "confirmed" && b.check_out_date <= today)),
    cancelled: bookings.filter((b) => ["cancelled", "expired"].includes(b.status)),
  };
  const list = buckets[tab] || [];

  async function handleCancel(ref) {
    if (!window.confirm(`Cancel booking ${ref}?`)) return;
    try {
      const updated = await cancelShortStayBooking(ref);
      setBookings((bs) => bs.map((b) => (b.id === updated.id ? updated : b)));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">My Short-Stay Bookings</h2>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                tab === t ? "bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] text-white shadow-md" : "bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-300"
              }`}>
              {t.charAt(0).toUpperCase() + t.slice(1)} ({buckets[t].length})
            </button>
          ))}
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm">{error}</div>}

        {loading ? (
          <p className="text-gray-400">Loading your bookings…</p>
        ) : list.length === 0 ? (
          <p className="text-gray-400">No {tab} bookings.</p>
        ) : (
          <div className="space-y-4">
            {list.map((b) => {
              const img = firstImage(b.property || {});
              const canCancel = b.status === "confirmed" && b.check_in_date >= today;
              return (
                <div key={b.id} className="bg-white rounded-2xl shadow-md p-4 flex flex-wrap gap-4 items-center">
                  {img
                    ? <img src={cloudImg(img, 200)} alt="" className="w-24 h-[70px] object-cover rounded-xl" />
                    : <div className="w-24 h-[70px] rounded-xl bg-gradient-to-br from-blue-50 to-emerald-50" />}
                  <div className="flex-1 min-w-[180px]">
                    <h4 className="font-bold text-gray-800">{b.property?.title || "Your booking"}</h4>
                    <p className="text-sm text-gray-500"><strong className="text-gray-700">{b.booking_reference}</strong></p>
                    <p className="text-sm text-gray-500">📅 {formatDate(b.check_in_date)} → {formatDate(b.check_out_date)} ({b.number_of_nights} night{b.number_of_nights > 1 ? "s" : ""})</p>
                    <p className="text-sm text-gray-500">💰 {formatKsh(b.total_amount)} {b.payment_status === "paid" ? "• Paid ✓" : `• Payment ${b.payment_status}`}</p>
                    {canCancel && (
                      <button onClick={() => handleCancel(b.booking_reference)}
                        className="mt-2 text-xs font-semibold text-red-500 border-2 border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        Cancel Booking
                      </button>
                    )}
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${BADGES[b.status] || "bg-gray-100 text-gray-600"}`}>
                    {b.status.replace("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}