import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Users, Search, Eye, Phone, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

type Partner = {
  id: number;
  name: string;
  company: string;
  service_type: string;
  city: string;
  phone: string;
  email: string;
  status: string;
  created_at: string | null;
};

const API_URL = "https://crm.fundsarthi.in/api/crm/partners/";

async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("finloan_token");
  const headers = new Headers(options.headers || {});

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...options, headers });
}

export default function Partners() {
  const { user, token } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const isAdmin = user?.role === "admin";

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await authenticatedFetch(API_URL);
      const data = await response.json().catch(() => null);

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          data?.message ||
            "You are not authorised to view partners. Please log out and sign in again."
        );
      }

      if (!response.ok) {
        throw new Error(data?.message || `Failed to load partners (${response.status}).`);
      }

      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : null;

      if (!rows) {
        throw new Error(data?.message || "The partners API returned an unexpected response.");
      }

      const normalized: Partner[] = rows.map((item: any) => ({
        id: Number(item.id ?? item._id ?? 0),
        name: String(item.name ?? ""),
        company: String(item.company ?? ""),
        service_type: String(item.service_type ?? ""),
        city: String(item.city ?? ""),
        phone: String(item.phone ?? ""),
        email: String(item.email ?? ""),
        status: String(item.status ?? "pending").toLowerCase(),
        created_at: item.created_at ?? null,
      }));

      setPartners(normalized);
    } catch (err) {
      console.error("Partner API Error:", err);
      setPartners([]);
      setError(err instanceof Error ? err.message : "Unable to load partners.");
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
    void fetchPartners();
  }, [token, fetchPartners]);

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatServiceType = (value: string) => {
    if (!value) return "-";
    return value
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredPartners = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return partners.filter((partner) => {
      const searchableValues = [
        partner.id,
        partner.name,
        partner.company,
        partner.service_type,
        partner.city,
        partner.phone,
        partner.email,
      ];

      const matchesSearch =
        !search ||
        searchableValues.some((value) =>
          String(value ?? "").toLowerCase().includes(search)
        );

      const matchesStatus =
        statusFilter === "all" ||
        partner.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [partners, searchTerm, statusFilter]);

  const totalPartners = partners.length;
  const pendingPartners = partners.filter((partner) => partner.status === "pending").length;
  const approvedPartners = partners.filter((partner) => partner.status === "approved").length;
  const rejectedPartners = partners.filter((partner) => partner.status === "rejected").length;

  const handleStatusChange = async (partnerId: number, status: string) => {
    if (!isAdmin) {
      setError("Only administrators can change partner status.");
      return;
    }

    try {
      setUpdatingStatus(true);
      setError("");

      const response = await authenticatedFetch(
        `https://crm.fundsarthi.in/api/crm/partners/${partnerId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to update status.");
      }

      await fetchPartners();
      setSelectedPartner((current) =>
        current ? { ...current, status } : null
      );
    } catch (err) {
      console.error("Status update error:", err);
      setError(err instanceof Error ? err.message : "Unable to update partner status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading partners...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Partner Management</h1>
        <p className="mt-1 text-gray-500">Manage banking and business partners</p>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => void fetchPartners()} className="rounded-lg border border-red-300 px-3 py-1.5 hover:bg-red-100">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
          <Building2 className="mb-3 h-8 w-8 opacity-80" />
          <p className="mb-1 text-sm text-blue-100">Total Partners</p>
          <p className="text-3xl font-bold">{totalPartners}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white">
          <Users className="mb-3 h-8 w-8 opacity-80" />
          <p className="mb-1 text-sm text-orange-100">Pending</p>
          <p className="text-3xl font-bold">{pendingPartners}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
          <Users className="mb-3 h-8 w-8 opacity-80" />
          <p className="mb-1 text-sm text-green-100">Approved</p>
          <p className="text-3xl font-bold">{approvedPartners}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-6 text-white">
          <Users className="mb-3 h-8 w-8 opacity-80" />
          <p className="mb-1 text-sm text-red-100">Rejected</p>
          <p className="text-3xl font-bold">{rejectedPartners}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, company, city, phone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-300 px-4 py-3"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Partner</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Company</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Service Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">City</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Phone</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.map((partner) => (
                <tr key={partner.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-blue-600">P{String(partner.id).padStart(3, "0")}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{partner.name || "-"}</p>
                    <p className="text-xs text-gray-500">{partner.email || "-"}</p>
                  </td>
                  <td className="px-6 py-4">{partner.company || "-"}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                      {formatServiceType(partner.service_type)}
                    </span>
                  </td>
                  <td className="capitalize px-6 py-4">{partner.city || "-"}</td>
                  <td className="px-6 py-4">
                    {partner.phone ? (
                      <a href={`tel:${partner.phone}`} className="flex items-center gap-2 text-blue-600">
                        <Phone className="h-4 w-4" /> {partner.phone}
                      </a>
                    ) : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      partner.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : partner.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                    }`}>
                      {partner.status ? partner.status.charAt(0).toUpperCase() + partner.status.slice(1) : "Pending"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{formatDate(partner.created_at)}</td>
                  <td className="px-6 py-4">
                    <button type="button" onClick={() => setSelectedPartner(partner)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                      <Eye className="h-4 w-4" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPartners.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            {error ? "Partners could not be loaded." : "No partners found"}
          </div>
        )}
      </div>

      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setSelectedPartner(null)}>
          <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Partner Details</h2>
                <p className="text-sm text-gray-500">P{String(selectedPartner.id).padStart(3, "0")}</p>
              </div>
              <button type="button" onClick={() => setSelectedPartner(null)} className="text-2xl text-gray-500 hover:text-gray-900" aria-label="Close details">×</button>
            </div>

            <div className="space-y-5">
              <Detail label="Name" value={selectedPartner.name} />
              <Detail label="Company" value={selectedPartner.company} />
              <Detail label="Service Type" value={formatServiceType(selectedPartner.service_type)} />
              <Detail label="City" value={selectedPartner.city} />
              <div>
                <p className="mb-1 text-xs text-gray-500">Phone</p>
                {selectedPartner.phone ? <a href={`tel:${selectedPartner.phone}`} className="font-medium text-blue-600">{selectedPartner.phone}</a> : <p>-</p>}
              </div>
              <div>
                <p className="mb-1 text-xs text-gray-500">Email</p>
                {selectedPartner.email ? (
                  <a href={`mailto:${selectedPartner.email}`} className="flex items-center gap-2 break-all text-blue-600">
                    <Mail className="h-4 w-4" /> {selectedPartner.email}
                  </a>
                ) : <p>-</p>}
              </div>
              <Detail label="Created Date" value={formatDate(selectedPartner.created_at)} />

              <div>
                <p className="mb-2 text-xs text-gray-500">Status</p>
                {isAdmin ? (
                  <select
                    value={selectedPartner.status}
                    disabled={updatingStatus}
                    onChange={(e) => void handleStatusChange(selectedPartner.id, e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 disabled:opacity-60"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                ) : (
                  <p className="font-medium capitalize text-gray-900">{selectedPartner.status || "pending"}</p>
                )}
                {!isAdmin && <p className="mt-1 text-xs text-gray-500">Read-only access</p>}
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
      <p className="font-medium text-gray-900">{value || "-"}</p>
    </div>
  );
}
