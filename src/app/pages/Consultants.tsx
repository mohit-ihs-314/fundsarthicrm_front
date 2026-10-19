import { useState, useEffect } from "react";
import {
  Star,
  CheckCircle,
  XCircle,
  MessageSquare,
  Pencil,
  X,
  Save,
} from "lucide-react";
import StatusBadge from "../components/StatusBadge";

type Consultant = {
  id: string | number;
  name: string;
  mobile: string;
  city: string;
  experience: string;
  status: string;
  rating: number;
  totalConsultations: number;
  expertise: string[];
  languages: string[];
  certificate: string;
  govt_id: string;
};

const API_BASE = "https://crm.fundsarthi.in/api/crm";
const getToken = () => localStorage.getItem("finloan_token") || "";
const authHeaders = (json = true): HeadersInit => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${getToken()}`,
});

function readStoredUser(): any {
  // Supports the common user storage keys used by the CRM login flow.
  for (const key of ["finloan_user", "finloan_admin", "user"]) {
    try {
      const value = localStorage.getItem(key);
      if (value) return JSON.parse(value);
    } catch {
      // Ignore malformed stored values and try the next key.
    }
  }
  return null;
}

export default function Consultants() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsultant, setSelectedConsultant] =
    useState<Consultant | null>(null);
  const [editingConsultant, setEditingConsultant] = useState<Consultant | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    mobile: "",
    city: "",
    experience: "",
    expertise: "",
    languages: "",
  });

  const storedUser = readStoredUser();
  const isAdmin =
    String(storedUser?.role || storedUser?.user?.role || "")
      .trim()
      .toLowerCase() === "admin";

  console.log("Consultants admin check:", {
    storedUser,
    isAdmin,
  });

  const openDocs = (consultant: Consultant) =>
    setSelectedConsultant(consultant);
  const closeDocs = () => setSelectedConsultant(null);

  const parseArray = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((item) => String(item));
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item));
    } catch {
      // Fall back to comma-separated values below.
    }
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const fetchConsultants = async () => {
    try {
      setErrorMessage("");
      const res = await fetch(`${API_BASE}/consultants`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to load consultants");

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.consultants)
          ? data.consultants
          : [];

      const normalized: Consultant[] = list.map((c: any) => ({
        id: c.id,
        name: c.name || "",
        mobile: c.mobile || "",
        city: c.city || "",
        experience: c.experience
          ? String(c.experience).toLowerCase().includes("year")
            ? String(c.experience)
            : `${c.experience} years`
          : "0 years",
        status:
          c.status === "approved"
            ? "active"
            : c.status === "rejected"
              ? "inactive"
              : c.status || "pending",
        rating: Number(c.rating || 4.5),
        totalConsultations: Number(c.totalConsultations || 0),
        expertise: parseArray(c.expertise),
        languages: parseArray(c.languages),
        certificate: c.certificate || "",
        govt_id: c.govt_id || "",
      }));
      setConsultants(normalized);
    } catch (error) {
      console.error("Consultants fetch failed:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load consultants",
      );
      setConsultants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchConsultants();
  }, []);

  const handleStatusChange = async (id: string | number, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/update-consultant-status`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.message || "Could not update consultant status");
      await fetchConsultants();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not update consultant status",
      );
    }
  };

  const handleApprove = (id: string | number) =>
    handleStatusChange(id, "approved");

  const handleReject = async (id: string | number) => {
    if (
      !window.confirm(
        "Reject and delete this consultant? This action cannot be undone.",
      )
    )
      return;
    try {
      const res = await fetch(`${API_BASE}/delete-consultant/${id}`, {
        method: "DELETE",
        headers: authHeaders(false),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.message || "Could not delete consultant");
      await fetchConsultants();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Could not delete consultant",
      );
    }
  };

  const startEdit = (consultant: Consultant) => {
    setEditingConsultant(consultant);
    setEditForm({
      name: consultant.name,
      mobile: consultant.mobile,
      city: consultant.city,
      experience: consultant.experience.replace(/\s*years?\s*/i, "").trim(),
      expertise: consultant.expertise.join(", "),
      languages: consultant.languages.join(", "),
    });
  };

  const saveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingConsultant || !isAdmin) return;

    setSaving(true);
    try {
      // Requires the admin-only PUT endpoint described in the setup instructions.
      const res = await fetch(
        `${API_BASE}/update-consultant/${editingConsultant.id}`,
        {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({
            name: editForm.name.trim(),
            mobile: editForm.mobile.trim(),
            city: editForm.city.trim(),
            experience: editForm.experience.trim(),
            expertise: editForm.expertise
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean),
            languages: editForm.languages
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean),
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          data.message ||
            "Could not save changes. Confirm the backend edit endpoint exists.",
        );
      setEditingConsultant(null);
      await fetchConsultants();
      alert("Consultant updated successfully.");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not save consultant changes",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading consultants...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Vastu Consultant Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage Vastu consultants and advisors
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat title="Total Consultants" value={consultants.length} />
        <Stat
          title="Active"
          value={consultants.filter((c) => c.status === "active").length}
        />
        <Stat
          title="Pending"
          value={consultants.filter((c) => c.status === "pending").length}
        />
        <Stat
          title="Total Consultations"
          value={consultants.reduce((sum, c) => sum + c.totalConsultations, 0)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {consultants.map((consultant) => (
          <div
            key={consultant.id}
            className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-all"
          >
            <div className="flex justify-between mb-4 gap-3">
              <div className="flex gap-3 min-w-0">
                <div className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                  {consultant.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 break-words">
                    {consultant.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {consultant.experience}
                  </p>
                  <p className="text-sm text-gray-500">{consultant.city}</p>
                </div>
              </div>
              <StatusBadge status={consultant.status} size="sm" />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold text-gray-900">
                {consultant.rating}
              </span>
              <span className="text-sm text-gray-500">
                ({consultant.totalConsultations} consultations)
              </span>
            </div>
            <div className="mb-4 text-sm text-gray-600">
              <p>{consultant.mobile}</p>
            </div>

            {consultant.expertise.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  EXPERTISE
                </p>
                <div className="flex flex-wrap gap-2">
                  {consultant.expertise.map((item, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {consultant.languages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  LANGUAGES
                </p>
                <div className="flex flex-wrap gap-2">
                  {consultant.languages.map((language, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => openDocs(consultant)}
              className="w-full bg-gray-800 text-white p-2 rounded-lg text-sm"
            >
              View Docs
            </button>

            <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-gray-100">
              {isAdmin && (
                <button
                  onClick={() => startEdit(consultant)}
                  className="flex-1 min-w-[110px] bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex gap-1 justify-center items-center"
                >
                  <Pencil className="w-4 h-4" /> Edit
                </button>
              )}
              {isAdmin && consultant.status === "pending" && (
                <>
                  <button
                    onClick={() => void handleApprove(consultant.id)}
                    className="flex-1 min-w-[110px] bg-green-600 text-white p-2 rounded-lg flex gap-1 justify-center items-center"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => void handleReject(consultant.id)}
                    className="flex-1 min-w-[110px] bg-red-600 text-white p-2 rounded-lg flex gap-1 justify-center items-center"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </>
              )}
              {consultant.status === "active" && (
                <>
                  <a
                    href={`https://wa.me/${consultant.mobile.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 min-w-[110px] bg-blue-600 text-white p-2 rounded-lg flex gap-1 justify-center items-center"
                  >
                    <MessageSquare className="w-4 h-4" /> Contact
                  </a>
                  {isAdmin && (
                    <button
                      onClick={() =>
                        void handleStatusChange(consultant.id, "inactive")
                      }
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      Deactivate
                    </button>
                  )}
                </>
              )}
              {isAdmin && consultant.status === "inactive" && (
                <button
                  onClick={() =>
                    void handleStatusChange(consultant.id, "active")
                  }
                  className="flex-1 bg-green-600 text-white p-2 rounded-lg"
                >
                  Activate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedConsultant && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeDocs}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={closeDocs}
              className="absolute top-3 right-3 text-gray-500"
              aria-label="Close documents"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold mb-4">
              Documents - {selectedConsultant.name}
            </h2>
            <DocumentPreview
              title="Certificate"
              url={selectedConsultant.certificate}
            />
            <DocumentPreview
              title="Government ID"
              url={selectedConsultant.govt_id}
            />
          </div>
        </div>
      )}

      {editingConsultant && isAdmin && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !saving && setEditingConsultant(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold">Edit Vastu Consultant</h2>
              <button
                type="button"
                onClick={() => setEditingConsultant(null)}
                disabled={saving}
                className="text-gray-500"
                aria-label="Close edit form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveEdit} className="space-y-4">
              <Field
                label="Full Name"
                value={editForm.name}
                onChange={(value) =>
                  setEditForm((prev) => ({ ...prev, name: value }))
                }
                required
              />
              <Field
                label="Mobile"
                value={editForm.mobile}
                onChange={(value) =>
                  setEditForm((prev) => ({ ...prev, mobile: value }))
                }
                required
              />
              <Field
                label="City"
                value={editForm.city}
                onChange={(value) =>
                  setEditForm((prev) => ({ ...prev, city: value }))
                }
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  label="Experience (years)"
                  type="number"
                  value={editForm.experience}
                  onChange={(value) =>
                    setEditForm((prev) => ({ ...prev, experience: value }))
                  }
                />
              </div>
              <Field
                label="Expertise (comma-separated)"
                value={editForm.expertise}
                onChange={(value) =>
                  setEditForm((prev) => ({ ...prev, expertise: value }))
                }
              />
              <Field
                label="Languages (comma-separated)"
                value={editForm.languages}
                onChange={(value) =>
                  setEditForm((prev) => ({ ...prev, languages: value }))
                }
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditingConsultant(null)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        min={type === "number" ? 0 : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}

function DocumentPreview({ title, url }: { title: string; url: string }) {
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold mb-2">{title}</p>
      {url ? (
        <img
          src={url}
          alt={title}
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          className="w-full h-64 object-contain border rounded-lg cursor-pointer hover:scale-[1.01] transition"
        />
      ) : (
        <p className="text-gray-400">Not uploaded</p>
      )}
      {url && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Click to view full image
        </p>
      )}
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
