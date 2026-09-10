import { useEffect, useState } from "react";
import PropertyCard from "../components/PropertyCard";
import ShortStayBookingModal from "../components/ShortStayBookingModal";
import { fetchShortStayProperties, todayISO } from "../lib/shortStayUtils";

const WHY = [
  ["✅", "Verified Properties"], ["🔒", "Secure Payments"], ["⚡", "Easy Booking"],
  ["🤝", "Trusted Hosts"], ["💰", "Clear Pricing"], ["📞", "Local Support"],
];

export default function ShortStays() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState({ location: "", check_in: "", nights: 1 });
  const [applied, setApplied] = useState("");
  const [bookingProperty, setBookingProperty] = useState(null);
  const [error, setError] = useState("");

  async function load(loc = "") {
    setLoading(true);
    setError("");
    try {
      setProperties(await fetchShortStayProperties(loc));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleSearch(e) {
    e?.preventDefault();
    setApplied(search.location.trim());
    load(search.location.trim());
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white pt-14 pb-24 px-4 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold mb-3">Find Your Perfect Short Stay</h1>
        <p className="text-white/80 text-lg mb-10">Comfortable, verified spaces for your next stay.</p>

        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-xl p-4 max-w-4xl mx-auto flex flex-wrap gap-3 text-left">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-bold text-blue-900 uppercase tracking-wide mb-1.5">Location</label>
            <input
              placeholder="Where to? e.g. Meru"
              value={search.location}
              onChange={(e) => setSearch((s) => ({ ...s, location: e.target.value }))}
              className="w-full p-3 border-2 border-gray-200 rounded-xl text-gray-800 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-blue-900 uppercase tracking-wide mb-1.5">Check-in</label>
            <input
              type="date" min={todayISO()}
              value={search.check_in}
              onChange={(e) => setSearch((s) => ({ ...s, check_in: e.target.value }))}
              className="w-full p-3 border-2 border-gray-200 rounded-xl text-gray-800 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-bold text-blue-900 uppercase tracking-wide mb-1.5">Nights</label>
            <select
              value={search.nights}
              onChange={(e) => setSearch((s) => ({ ...s, nights: Number(e.target.value) }))}
              className="w-full p-3 border-2 border-gray-200 rounded-xl text-gray-800 outline-none focus:border-blue-500 bg-white cursor-pointer"
            >
              {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] text-white font-bold px-8 py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
              Search Stays
            </button>
          </div>
        </form>
      </div>

      {/* Listings */}
      <div className="max-w-6xl mx-auto px-4 -mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {applied ? `Short Stays in "${applied}"` : "Featured Short Stays"}
        </h2>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm">{error}</div>}

        {loading ? (
          <p className="text-gray-400">Loading stays…</p>
        ) : properties.length === 0 ? (
          <p className="text-gray-400">No short-stay properties found yet. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                onViewDetails={setBookingProperty}
                isFavorite={false}
                onToggleFavorite={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      {/* Why book */}
      <div className="max-w-6xl mx-auto px-4 mt-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Why Book With Rheaspark?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {WHY.map(([icon, label]) => (
            <div key={label} className="bg-white rounded-2xl shadow-md p-5 text-center">
              <div className="text-3xl mb-2">{icon}</div>
              <div className="text-sm font-semibold text-gray-700">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {bookingProperty && (
        <ShortStayBookingModal
          property={bookingProperty}
          initialCheckIn={search.check_in}
          initialNights={search.nights}
          onClose={() => setBookingProperty(null)}
        />
      )}
    </div>
  );
}