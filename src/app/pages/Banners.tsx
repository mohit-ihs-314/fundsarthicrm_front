import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Power,
  Image as ImageIcon,
  X,
  Upload,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE = "https://crm.fundsarthi.in";

interface Banner {
  id: number;
  title: string;
  image_url: string;
  redirect_url: string | null;
  is_active: boolean;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

interface BannerForm {
  title: string;
  image_url: string;
  redirect_url: string;
  is_active: boolean;
  display_order: number;
}

const emptyForm: BannerForm = {
  title: "",
  image_url: "",
  redirect_url: "",
  is_active: true,
  display_order: 1,
};

async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("finloan_token");
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...options, headers });
}

export default function Banners() {
  const { user, token } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<BannerForm>(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = user?.role === "admin";

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await authenticatedFetch(`${API_BASE}/api/crm/banners/`);
      const data = await res.json().catch(() => null);

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          data?.message ||
            "You are not authorised to manage banners. Please sign in with an admin account."
        );
      }

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load banners.");
      }

      if (data?.success) {
        setBanners(Array.isArray(data.data) ? data.data : []);
      } else if (Array.isArray(data)) {
        setBanners(data);
      } else {
        throw new Error(data?.message || "The banners API returned an unexpected response.");
      }
    } catch (err) {
      console.error("Fetch banners error:", err);
      setBanners([]);
      setError(err instanceof Error ? err.message : "Unable to load banners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Your login session is missing. Please log out and log in again.");
      return;
    }
    void fetchBanners();
    // Fetch when the authenticated session changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const openAddModal = () => {
    setEditingBanner(null);
    setFormData({ ...emptyForm, display_order: banners.length + 1 });
    setSelectedFile(null);
    setPreviewUrl("");
    setShowModal(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || "",
      image_url: banner.image_url || "",
      redirect_url: banner.redirect_url || "",
      is_active: Boolean(banner.is_active),
      display_order: banner.display_order || 1,
    });
    setSelectedFile(null);
    setPreviewUrl(banner.image_url || "");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setSelectedFile(null);
    setPreviewUrl("");
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleActiveChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, is_active: e.target.checked }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be smaller than 10MB.");
      e.target.value = "";
      return;
    }

    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const uploadData = new FormData();
    uploadData.append("file", file);

    const res = await authenticatedFetch(`${API_BASE}/api/crm/upload-image`, {
      method: "POST",
      body: uploadData,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || data?.status !== "success" || !data?.url) {
      throw new Error(data?.message || "Image upload failed.");
    }

    return data.url;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isAdmin) {
      alert("Only administrators can create or edit banners.");
      return;
    }

    if (!formData.title.trim()) {
      alert("Banner title is required.");
      return;
    }

    if (!editingBanner && !selectedFile) {
      alert("Please select a banner image.");
      return;
    }

    setUploading(true);

    try {
      let imageUrl = formData.image_url;
      if (selectedFile) imageUrl = await uploadImage(selectedFile);

      if (!imageUrl) {
        alert("Banner image is required.");
        return;
      }

      const payload = {
        title: formData.title.trim(),
        image_url: imageUrl,
        redirect_url: formData.redirect_url.trim() || null,
        is_active: formData.is_active,
        display_order: formData.display_order,
      };

      const url = editingBanner
        ? `${API_BASE}/api/crm/banners/${editingBanner.id}`
        : `${API_BASE}/api/crm/banners/`;

      const res = await authenticatedFetch(url, {
        method: editingBanner ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to save banner.");
      }

      alert(editingBanner ? "Banner updated successfully." : "Banner created successfully.");
      closeModal();
      await fetchBanners();
    } catch (err) {
      console.error("Save banner error:", err);
      alert(err instanceof Error ? err.message : "Something went wrong while saving the banner.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!isAdmin) return;
    if (!window.confirm("Delete this banner?")) return;

    try {
      const res = await authenticatedFetch(`${API_BASE}/api/crm/banners/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to delete banner.");
      }

      await fetchBanners();
    } catch (err) {
      console.error("Delete banner error:", err);
      alert(err instanceof Error ? err.message : "Unable to delete banner.");
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    if (!isAdmin) return;

    try {
      const res = await authenticatedFetch(`${API_BASE}/api/crm/banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !banner.is_active }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to update banner.");
      }

      await fetchBanners();
    } catch (err) {
      console.error("Toggle banner error:", err);
      alert(err instanceof Error ? err.message : "Unable to update banner status.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Banner management is available to administrator accounts only.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage banners displayed in the FundsArthi app.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-white"
          style={{ background: "linear-gradient(135deg, #0F766E 0%, #D4AF37 100%)" }}
        >
          <Plus className="h-4 w-4" />
          Add Banner
        </button>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => void fetchBanners()} className="rounded-lg border border-red-300 px-3 py-1.5 hover:bg-red-100">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-gray-500">Loading banners...</div>
      ) : banners.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-800">No banners yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first banner to display it in the app.</p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-5 rounded-lg px-4 py-2 text-white"
            style={{ background: "linear-gradient(135deg, #0F766E 0%, #D4AF37 100%)" }}
          >
            Add Banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {banners.map((banner) => (
            <div key={banner.id} className="overflow-hidden rounded-2xl border bg-white transition-all hover:shadow-md">
              <div className="relative h-56 bg-gray-100">
                <img src={banner.image_url} alt={banner.title} className="h-full w-full object-cover" />
                <div className="absolute left-3 top-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${banner.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                    {banner.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="absolute right-3 top-3">
                  <span className="rounded-full bg-black/60 px-3 py-1 text-xs text-white">Order #{banner.display_order}</span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{banner.title}</h3>
                    {banner.redirect_url && (
                      <a href={banner.redirect_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                        Open Link <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">#{banner.id}</span>
                </div>

                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => openEditModal(banner)} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 text-gray-700 hover:bg-gray-50">
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleToggleActive(banner)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 ${banner.is_active ? "bg-orange-100 text-orange-700 hover:bg-orange-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                  >
                    <Power className="h-4 w-4" />
                    {banner.is_active ? "Disable" : "Enable"}
                  </button>
                  <button type="button" onClick={() => void handleDelete(banner.id)} className="flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700" aria-label={`Delete banner ${banner.title}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">{editingBanner ? "Edit Banner" : "Add Banner"}</h2>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close modal">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label htmlFor="banner-title" className="mb-1 block text-sm font-medium text-gray-700">Banner Title</label>
                <input
                  id="banner-title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Puri Commercial"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Banner Image</label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-teal-500">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-600">{selectedFile ? selectedFile.name : "Click to choose an image"}</span>
                  <span className="mt-1 text-xs text-gray-400">Maximum 10MB</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>

                {previewUrl && (
                  <div className="mt-4 overflow-hidden rounded-xl border">
                    <img src={previewUrl} alt="Banner preview" className="max-h-64 w-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="banner-redirect" className="mb-1 block text-sm font-medium text-gray-700">Redirect URL</label>
                <input
                  id="banner-redirect"
                  type="url"
                  name="redirect_url"
                  value={formData.redirect_url}
                  onChange={handleInputChange}
                  placeholder="https://fundsarthi.in/..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label htmlFor="banner-order" className="mb-1 block text-sm font-medium text-gray-700">Display Order</label>
                <input
                  id="banner-order"
                  type="number"
                  name="display_order"
                  min="1"
                  value={formData.display_order}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={formData.is_active} onChange={handleActiveChange} className="h-4 w-4" />
                <span className="text-sm font-medium text-gray-700">Banner is active</span>
              </label>

              <div className="flex justify-end gap-3 border-t pt-3">
                <button type="button" onClick={closeModal} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded-lg px-5 py-2 text-white disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #0F766E 0%, #D4AF37 100%)" }}
                >
                  {uploading ? "Saving..." : editingBanner ? "Update Banner" : "Save Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
