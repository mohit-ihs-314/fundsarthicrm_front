import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  Search,
} from "lucide-react";
import StatusBadge from "../components/StatusBadge";

export default function Bookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ FETCH

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("finloan_token");

      const res = await fetch("https://crm.fundsarthi.in/api/crm/bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load bookings");
      }

      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Bookings fetch failed:", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // ✅ MARK COMPLETE (API)
  const handleMarkCompleted = async (bookingId: string) => {
    await fetch("https://crm.fundsarthi.in/api/crm/update-booking-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: bookingId,
        status: "completed",
      }),
    });

    fetchBookings();
  };

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.consultantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return <div className="p-6">Loading bookings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* SAME UI BELOW (UNCHANGED) */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Booking Management
          </h1>
          <p className="text-gray-500 mt-1">
            View and manage consultation bookings
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by booking ID, consultant, or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl"
          />
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat title="Total Bookings" value={filteredBookings.length} />
        <Stat
          title="Scheduled"
          value={
            filteredBookings.filter((b) => b.status === "scheduled").length
          }
        />
        <Stat
          title="Completed"
          value={
            filteredBookings.filter((b) => b.status === "completed").length
          }
        />
      </div>

      {/* TABLE SAME */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Consultant
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 text-blue-600">{booking.id}</td>
                  <td className="px-6 py-4">{booking.consultantName}</td>
                  <td className="px-6 py-4">
                    {booking.customerName}
                    <p className="text-xs text-gray-500">
                      {booking.customerMobile}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {booking.date} | {booking.time}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-6 py-4">
                    {booking.status === "scheduled" && (
                      <button onClick={() => handleMarkCompleted(booking.id)}>
                        Mark Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// helper
const Stat = ({ title, value }: any) => (
  <div className="bg-white rounded-xl p-4 border">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);
