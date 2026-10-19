import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Search, Eye } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import LoanDetailDrawer from "../components/LoanDetailDrawer";
import { useAuth } from "../context/AuthContext";

type Loan = {
  id: string;
  userName?: string;
  mobile?: string;
  loanAmount?: number | string;
  loanType?: string;
  status?: string;
  appliedDate?: string | null;
  formData?: Record<string, any>;
  [key: string]: any;
};

async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("finloan_token");

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...options, headers });
}

export default function LoanApplications() {
  const { user, token } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = user?.role === "admin";

  const formatLoanDate = (date: string | null | undefined) => {
    if (!date) return "-";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await authenticatedFetch(
        "https://crm.fundsarthi.in/api/crm/loans"
      );

      const data = await res.json().catch(() => null);

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          "You are not authorised to view loan applications. Please log out and log in again."
        );
      }

      if (!res.ok) {
        throw new Error(data?.message || `Unable to load loans (${res.status}).`);
      }

      if (!Array.isArray(data)) {
        throw new Error(data?.message || "The loans API returned an unexpected response.");
      }

      const normalized: Loan[] = data.map((loan: any) => {
        const form = loan?.formData || {};

        return {
          ...loan,
          id: String(loan?.id ?? loan?._id ?? ""),
          status: String(loan?.status || "new").toLowerCase(),
          companyName: form.companyName || loan?.companyName || "",
          salary: form.salary || loan?.salary || "",
          propertyType: form.propertyType || loan?.propertyType || "",
          propertyValue: form.propertyValue || loan?.propertyValue || "",
          businessName: form.businessName || loan?.businessName || "",
          turnover: form.turnover || loan?.turnover || "",
          requirementType: form.requirementType || loan?.requirementType || "",
        };
      });

      setLoans(normalized);
    } catch (err) {
      console.error("Fetch loans error:", err);
      setLoans([]);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while loading loan applications."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      void fetchLoans();
    } else {
      setLoading(false);
      setError("Your login session is missing. Please log out and log in again.");
    }
  }, [token, fetchLoans]);

  const handleStatusChange = async (loanId: string, newStatus: string) => {
    if (!isAdmin) {
      setError("Viewer accounts can view loan applications but cannot change their status.");
      return;
    }

    try {
      let parsedStatus: Record<string, any>;
      try {
        parsedStatus = JSON.parse(newStatus);
      } catch {
        parsedStatus = { status: newStatus };
      }

      const res = await authenticatedFetch(
        "https://crm.fundsarthi.in/api/crm/update-status",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loanId, ...parsedStatus }),
        }
      );

      const responseData = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(responseData?.message || "Unable to update loan status.");
      }

      await fetchLoans();
      setSelectedLoan(null);
    } catch (err) {
      console.error("Update loan status error:", err);
      setError(err instanceof Error ? err.message : "Unable to update loan status.");
    }
  };

  const filteredLoans = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return loans.filter((loan) => {
      const matchesSearch =
        String(loan.userName || "").toLowerCase().includes(search) ||
        String(loan.id || "").toLowerCase().includes(search) ||
        String(loan.mobile || "").includes(search) ||
        String(loan.companyName || "").toLowerCase().includes(search) ||
        String(loan.businessName || "").toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" || loan.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [loans, searchTerm, statusFilter]);

  if (loading) {
    return <div className="p-6">Loading loans...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Loan Applications
          </h1>
          <p className="mt-1 text-gray-500">
            View and track loan applications
          </p>
        </div>
        {!isAdmin && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
            Read-only access
          </span>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void fetchLoans()}
            className="rounded-lg border border-red-300 px-3 py-1.5 font-medium hover:bg-red-100"
          >
            Try again
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-300 px-4 py-2"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="in-process">In Process</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Application ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">User Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Mobile</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Loan Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Loan Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map((loan) => {
                const amount = Number(loan.loanAmount || 0);

                return (
                  <tr
                    key={loan.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedLoan(loan)}
                  >
                    <td className="px-6 py-4 text-blue-600">{loan.id || "-"}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatLoanDate(loan.appliedDate)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{loan.userName || "-"}</p>
                        {loan.companyName && (
                          <p className="text-xs text-gray-500">{loan.companyName}</p>
                        )}
                        {loan.businessName && (
                          <p className="text-xs text-gray-500">{loan.businessName}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{loan.mobile || "-"}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      ₹{(amount / 100000).toFixed(2)}L
                    </td>
                    <td className="px-6 py-4">{loan.loanType || "-"}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={loan.status || "new"} />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLoan(loan);
                        }}
                        className="flex items-center gap-1 text-blue-600"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLoans.length === 0 && !error && (
          <div className="py-12 text-center text-gray-500">
            No loan applications found
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Stat title="Total" value={filteredLoans.length} color="blue" />
        <Stat
          title="In Process"
          value={filteredLoans.filter((loan) => loan.status === "in-process").length}
          color="orange"
        />
        <Stat
          title="Approved"
          value={filteredLoans.filter((loan) => loan.status === "approved").length}
          color="green"
        />
        <Stat
          title="Rejected"
          value={filteredLoans.filter((loan) => loan.status === "rejected").length}
          color="red"
        />
      </div>

      {selectedLoan && (
        <LoanDetailDrawer
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

const Stat = ({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: "blue" | "orange" | "green" | "red";
}) => {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 text-blue-700",
    orange: "bg-orange-50 text-orange-600 text-orange-700",
    green: "bg-green-50 text-green-600 text-green-700",
    red: "bg-red-50 text-red-600 text-red-700",
  };
  const [backgroundClass, labelClass, valueClass] = colorClasses[color].split(" ");

  return (
    <div className={`rounded-xl p-4 ${backgroundClass}`}>
      <p className={`text-sm ${labelClass}`}>{title}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
};
