import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Eye, Phone, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

type PropertyEnquiry = {
  id: number;
  property_id: number;
  property_title: string;
  name: string;
  mobile: string;
  email: string;
  message: string;
  status: string;
  created_at: string | null;
};

const API_URL = "https://crm.fundsarthi.in/api/crm/property-enquiries/";

async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("finloan_token");
  const headers = new Headers(options.headers || {});

  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, { ...options, headers });
}

export default function PropertyEnquiries() {
  const { token } = useAuth();
  const [enquiries, setEnquiries] = useState<PropertyEnquiry[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<PropertyEnquiry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEnquiries = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await authenticatedFetch(API_URL);
      const data = await res.json().catch(() => null);

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          data?.message ||
            "You are not authorised to view property enquiries. Please log out and log in again."
        );
      }

      if (!res.ok) {
        throw new Error(data?.message || `Failed to load property enquiries (${res.status}).`);
      }

      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : null;

      if (!rows) {
        throw new Error(data?.message || "The property enquiries API returned an unexpected response.");
      }

      const normalized: PropertyEnquiry[] = rows.map((item: any) => ({
        id: Number(item.id ?? item._id ?? 0),
        property_id: Number(item.property_id ?? 0),
        property_title: String(item.property_title ?? item.propertyTitle ?? ""),
        name: String(item.name ?? ""),
        mobile: String(item.mobile ?? item.phone ?? ""),
        email: String(item.email ?? ""),
        message: String(item.message ?? ""),
        status: String(item.status ?? "new").toLowerCase(),
        created_at: item.created_at ?? null,
      }));

      setEnquiries(normalized);
    } catch (err) {
      console.error("Property enquiry error:", err);
      setEnquiries([]);
      setError(err instanceof Error ? err.message : "Unable to load property enquiries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Your login session is missing. Please log out and log in again.");
      return;
    }
    void fetchEnquiries();
  }, [token, fetchEnquiries]);

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "-";

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredEnquiries = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return enquiries.filter((enquiry) => {
      if (!search) return true;

      return [
        enquiry.id,
        enquiry.property_id,
        enquiry.name,
        enquiry.mobile,
        enquiry.email,
        enquiry.property_title,
        enquiry.message,
        enquiry.status,
      ].some((value) => String(value ?? "").toLowerCase().includes(search));
    });
  }, [enquiries, searchTerm]);

  if (loading) {
    return <div className="p-6">Loading property enquiries...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Property Enquiries</h1>
        <p className="mt-1 text-gray-500">Manage and track property enquiries</p>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void fetchEnquiries()}
            className="rounded-lg border border-red-300 px-3 py-1.5 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, mobile, email, or property..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Property</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Mobile</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.map((enquiry) => (
                <tr
                  key={enquiry.id}
                  className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                  onClick={() => setSelectedEnquiry(enquiry)}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {formatDate(enquiry.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{enquiry.property_title || "-"}</p>
                    <p className="text-xs text-gray-500">Property ID: {enquiry.property_id || "-"}</p>
                  </td>
                  <td className="px-6 py-4 font-medium">{enquiry.name || "-"}</td>
                  <td className="px-6 py-4">
                    {enquiry.mobile ? (
                      <a
                        href={`tel:${enquiry.mobile}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 text-blue-600"
                      >
                        <Phone className="h-4 w-4" /> {enquiry.mobile}
                      </a>
                    ) : "-"}
                  </td>
                  <td className="px-6 py-4">
                    {enquiry.email ? (
                      <a
                        href={`mailto:${enquiry.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 text-blue-600"
                      >
                        <Mail className="h-4 w-4" /> {enquiry.email}
                      </a>
                    ) : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                      {enquiry.status || "new"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEnquiry(enquiry);
                      }}
                      className="flex items-center gap-1 text-blue-600"
                    >
                      <Eye className="h-4 w-4" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEnquiries.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            {error ? "Property enquiries could not be loaded." : "No property enquiries found"}
          </div>
        )}
      </div>

      {selectedEnquiry && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40"
          onClick={() => setSelectedEnquiry(null)}
        >
          <div
            className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Property Enquiry</h2>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="text-xl text-gray-500 hover:text-gray-900"
                aria-label="Close details"
              >
                ×
              </button>
            </div>

            <div className="space-y-5">
              <Detail label="Date" value={formatDate(selectedEnquiry.created_at)} />
              <Detail label="Property" value={selectedEnquiry.property_title} />
              <Detail label="Property ID" value={selectedEnquiry.property_id} />
              <Detail label="Customer" value={selectedEnquiry.name} />
              <div>
                <p className="text-xs text-gray-500">Mobile</p>
                {selectedEnquiry.mobile ? (
                  <a href={`tel:${selectedEnquiry.mobile}`} className="text-blue-600">
                    {selectedEnquiry.mobile}
                  </a>
                ) : <p>-</p>}
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                {selectedEnquiry.email ? (
                  <a href={`mailto:${selectedEnquiry.email}`} className="break-all font-medium text-blue-600">
                    {selectedEnquiry.email}
                  </a>
                ) : <p>-</p>}
              </div>
              <div>
                <p className="text-xs text-gray-500">Message</p>
                <div className="mt-1 rounded-xl bg-gray-50 p-4 text-gray-700">
                  {selectedEnquiry.message || "No message"}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <span className="mt-1 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                  {selectedEnquiry.status || "new"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p className="break-words font-medium text-gray-900">{value || "-"}</p>
    </div>
  );
}
