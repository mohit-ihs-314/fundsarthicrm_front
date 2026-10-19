import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ShieldCheck,
  UserPlus,
  RefreshCw,
  Users,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";

const API_BASE = "https://crm.fundsarthi.in/crm";

type CRMRole =
  | "admin"
  | "loan_viewer"
  | "property_viewer"
  | "vaastu_viewer";

type CRMUser = {
  id: number;
  name: string;
  email: string;
  role: CRMRole;
};

const roles: { value: CRMRole; label: string }[] = [
  { value: "admin", label: "Admin — Full CRM access" },
  { value: "loan_viewer", label: "Loan Viewer — Loan applications" },
  { value: "property_viewer", label: "Property Viewer — Properties" },
  { value: "vaastu_viewer", label: "Vaastu Viewer — Consultants" },
];

const roleLabels: Record<CRMRole, string> = {
  admin: "Admin",
  loan_viewer: "Loan Viewer",
  property_viewer: "Property Viewer",
  vaastu_viewer: "Vaastu Viewer",
};

function getHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${localStorage.getItem("finloan_token") || ""}`,
    "Content-Type": "application/json",
  };
}

export default function CRMUsers() {
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<CRMRole>("loan_viewer");

  const [editingUser, setEditingUser] = useState<CRMUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<CRMRole>("loan_viewer");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/admin-users`, {
        headers: getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load CRM users.");
      }

      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load CRM users."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(`${API_BASE}/create-admin`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create CRM account.");
      }

      setName("");
      setEmail("");
      setPassword("");
      setRole("loan_viewer");
      setSuccess("CRM account created successfully.");

      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create CRM account."
      );
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (user: CRMUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setError("");
    setSuccess("");
  };

  const handleUpdateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingUser) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      // Confirm the backend's update route and HTTP method before enabling.
      const response = await fetch(
        `${API_BASE}/admin-users/${editingUser.id}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            name: editName.trim(),
            email: editEmail.trim().toLowerCase(),
            role: editRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Unable to update account (HTTP ${response.status}).`
        );
      }

      setEditingUser(null);
      setSuccess("CRM account updated successfully.");
      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update CRM account."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user: CRMUser) => {
    const confirmed = window.confirm(
      `Delete the CRM account for ${user.name} (${user.email})? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(user.id);

    try {
      // Confirm the backend's delete route and HTTP method before enabling.
      const response = await fetch(
        `${API_BASE}/admin-users/${user.id}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Unable to delete account (HTTP ${response.status}).`
        );
      }

      setSuccess("CRM account deleted successfully.");
      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete CRM account."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            CRM User Management
          </h1>
          <p className="mt-1 text-gray-500">
            Create staff accounts and manage CRM access by role.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadUsers()}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-1">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-teal-50 p-3">
              <UserPlus className="h-6 w-6 text-teal-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Create CRM User
              </h2>
              <p className="text-sm text-gray-500">
                New staff login credentials
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label htmlFor="crm-name" className="mb-1 block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                id="crm-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                autoComplete="name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label htmlFor="crm-email" className="mb-1 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="crm-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={150}
                autoComplete="email"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                placeholder="user@company.com"
              />
            </div>

            <div>
              <label htmlFor="crm-password" className="mb-1 block text-sm font-medium text-gray-700">
                Temporary password
              </label>
              <input
                id="crm-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="crm-role" className="mb-1 block text-sm font-medium text-gray-700">
                Access role
              </label>
              <select
                id="crm-role"
                value={role}
                onChange={(e) => setRole(e.target.value as CRMRole)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {roles.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              {creating ? "Creating account..." : "Create CRM User"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3">
                <Users className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Existing CRM Accounts
                </h2>
                <p className="text-sm text-gray-500">
                  {users.length} account{users.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center text-gray-500">
              Loading CRM accounts...
            </p>
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              No CRM accounts found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-600">
                    <th className="px-3 py-3 font-medium">Name</th>
                    <th className="px-3 py-3 font-medium">Email</th>
                    <th className="px-3 py-3 font-medium">Role</th>
                    <th className="px-3 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="px-3 py-4 font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-3 py-4 text-gray-600">{user.email}</td>
                      <td className="px-3 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {roleLabels[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(user)}
                            className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2 py-1.5 text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteUser(user)}
                            disabled={deletingId === user.id}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1.5 text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingId === user.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-crm-user-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id="edit-crm-user-title" className="text-xl font-semibold text-gray-900">
                Edit CRM User
              </h2>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg p-2 hover:bg-gray-100"
                aria-label="Close edit dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label htmlFor="edit-crm-name" className="mb-1 block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <input
                  id="edit-crm-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  maxLength={100}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="edit-crm-email" className="mb-1 block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="edit-crm-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  maxLength={150}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="edit-crm-role" className="mb-1 block text-sm font-medium text-gray-700">
                  Access role
                </label>
                <select
                  id="edit-crm-role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as CRMRole)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                >
                  {roles.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg border px-4 py-2 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}