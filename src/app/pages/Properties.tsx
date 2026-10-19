import { useState, useEffect } from "react";

import {
  MapPin,
  CheckCircle,
  XCircle,
  Bed,
  Bath,
  Maximize,
  Plus,
  X,
  Pencil,
  Search,
} from "lucide-react";

import Papa from "papaparse";

import StatusBadge from "../components/StatusBadge";

import PropertyDetailDrawer from "../components/PropertyDetailDrawer";

const BULK_TEMPLATE_COLUMNS = [
  "property_id",

  "title",

  "category", // residential | commercial | sco | plot

  "sub_property_type", // apartment/builder-floor/villa | shop/office-space | sco | residential-plot/commercial-plot

  "purpose",

  "city",

  "locality",

  "latitude",

  "longitude",

  "price",

  "size",

  "bedrooms", // residential only

  "bathrooms", // residential only

  "plot_area", // plot only

  "frontage", // plot only

  "road_width", // plot only

  "dimensions", // plot only

  "washrooms", // commercial/SCO only

  "parking",

  "description",

  "name",

  "mobile",

  "email",

  "owner_type", // builder | individual | broker | investor | company

  "builder", // only when owner_type = builder

  "project_name",

  "furnishing",

  "construction_status",

  "photos",
];

const BULK_TEMPLATE_EXAMPLE_ROW: Record<string, string> = {
  property_id: "PROP001",

  title: "Spacious 3BHK Apartment in Sector 48",

  category: "residential",

  sub_property_type: "apartment",

  purpose: "sell",

  city: "Gurgaon",

  locality: "Sector 48",

  latitude: "28.4089",

  longitude: "77.0378",

  price: "12000000",

  size: "1450",

  bedrooms: "3",

  bathrooms: "2",

  plot_area: "",

  frontage: "",

  road_width: "",

  dimensions: "",

  washrooms: "",

  parking: "yes",

  description: "Well-ventilated 3BHK with modular kitchen",

  name: "Owner Name",

  mobile: "9999999999",

  email: "owner@example.com",

  owner_type: "builder",

  builder: "DLF",

  project_name: "DLF Phase 5",

  furnishing: "semi-furnished",

  construction_status: "ready-to-move",

  photos: "PROP001_1.jpg|PROP001_2.jpg",
};

export default function Properties() {
  const [properties, setProperties] = useState<any[]>([]);

  const [filter, setFilter] = useState<string>("all");

  const [searchTerm, setSearchTerm] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [showBulkModal, setShowBulkModal] = useState(false);

  const [bulkCsvFile, setBulkCsvFile] = useState<File | null>(null);

  const [bulkImageFiles, setBulkImageFiles] = useState<File[]>([]);

  const [bulkBusy, setBulkBusy] = useState(false);

  const [bulkStatus, setBulkStatus] = useState("");

  const storedUser = JSON.parse(localStorage.getItem("finloan_user") || "{}");
  const isAdmin = storedUser.role === "admin";

  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");

  const [formData, setFormData] = useState({
    title: "",

    location: "",

    city: "",

    type: "Apartment",

    price: "",

    bedrooms: "",

    bathrooms: "",

    area: "",
  }); // ✅ FETCH

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem("finloan_token");

      const res = await fetch("https://crm.fundsarthi.in/api/crm/properties", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load properties");
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.properties)
          ? data.properties
          : [];

      const safeData = list.map((p: any) => ({
        ...p,
        photos: Array.isArray(p.photos) ? p.photos : [],
        price: p.price || 0,
      }));

      setProperties(safeData);
    } catch (err) {
      console.error("Properties fetch failed:", err);
      setProperties([]);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []); // ✅ APPROVE

  const handleApprove = async (id: string) => {
    await fetch("https://crm.fundsarthi.in/api/crm/update-property-status", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        id,

        status: "approved",
      }),
    });

    fetchProperties();
  }; // ✅ REJECT

  const handleReject = async (id: string) => {
    await fetch("https://crm.fundsarthi.in/api/crm/update-property-status", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({ id, status: "rejected" }),
    });

    fetchProperties();
  }; // INPUT CHANGE

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
  }; // ADD PROPERTY

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      await fetch("https://crm.fundsarthi.in/api/crm/add-property", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(formData),
      });

      fetchProperties();

      setShowAddModal(false); // reset form

      setFormData({
        title: "",

        location: "",

        city: "",

        type: "Apartment",

        price: "",

        bedrooms: "",

        bathrooms: "",

        area: "",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Select properties first.");

      return;
    }

    if (!window.confirm(`Delete ${selectedIds.length} properties?`)) return;

    await fetch("https://crm.fundsarthi.in/api/crm/delete-properties", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        ids: selectedIds,
      }),
    });

    setSelectedIds([]);

    fetchProperties();
  };

  const handleCSVUpload = async (e: any) => {
    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);

    try {
      const res = await fetch(
        "https://crm.fundsarthi.in/api/crm/import-properties",

        {
          method: "POST",

          body: formData,
        },
      );

      const data = await res.json();

      alert(data.message);

      fetchProperties();
    } catch (err) {
      console.log(err);
    }
  };

  const downloadBulkTemplate = () => {
    const csv = Papa.unparse({
      fields: BULK_TEMPLATE_COLUMNS,

      data: [
        BULK_TEMPLATE_COLUMNS.map(
          (col) => BULK_TEMPLATE_EXAMPLE_ROW[col] || "",
        ),
      ],
    });

    const blob = new Blob([csv], { type: "text/csv" });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "bulk-properties-template.csv";

    link.click();

    URL.revokeObjectURL(url);
  }; // Uploads image files with limited concurrency so a large batch doesn't
  // fire hundreds of simultaneous requests at once.

  const uploadImagesWithLimit = async (
    files: File[],

    onProgress: (done: number, total: number) => void,
  ) => {
    const urlByFilename: Record<string, string> = {};

    const concurrency = 3;

    let index = 0;

    let done = 0;

    const worker = async () => {
      while (index < files.length) {
        const currentIndex = index++;

        const file = files[currentIndex];

        const formData = new FormData();

        formData.append("file", file);

        try {
          const res = await fetch(
            "https://crm.fundsarthi.in/api/crm/upload-image",

            { method: "POST", body: formData },
          );

          const data = await res.json();

          if (data.status === "success") {
            urlByFilename[file.name.toLowerCase()] = data.url;
          }
        } catch (err) {
          console.error("Image upload failed:", file.name, err);
        }

        done++;

        onProgress(done, files.length);
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(concurrency, files.length) }, worker),
    );

    return urlByFilename;
  };

  const handleBulkImport = async () => {
    if (!bulkCsvFile) {
      alert("Please choose a CSV file first.");

      return;
    }

    setBulkBusy(true);

    try {
      let urlByFilename: Record<string, string> = {};

      if (bulkImageFiles.length > 0) {
        setBulkStatus(`Uploading images: 0/${bulkImageFiles.length}`);

        urlByFilename = await uploadImagesWithLimit(
          bulkImageFiles,

          (doneCount, total) =>
            setBulkStatus(`Uploading images: ${doneCount}/${total}`),
        );
      }

      setBulkStatus("Reading CSV...");

      const parsed = await new Promise<
        Papa.ParseResult<Record<string, string>>
      >((resolve, reject) => {
        Papa.parse(bulkCsvFile, {
          header: true,

          skipEmptyLines: true,

          complete: resolve,

          error: reject,
        });
      });

      const unmatchedFilenames = new Set<string>();

      const rows = parsed.data.map((row) => {
        if (!row.photos) return row;

        const resolvedPhotos = row.photos

          .split("|")

          .map((token) => token.trim())

          .filter(Boolean)

          .map((token) => {
            if (token.startsWith("http")) return token;

            const url = urlByFilename[token.toLowerCase()];

            if (!url) unmatchedFilenames.add(token);

            return url;
          })

          .filter(Boolean);

        return { ...row, photos: resolvedPhotos.join("|") };
      });

      if (unmatchedFilenames.size > 0) {
        const proceed = window.confirm(
          `${unmatchedFilenames.size} photo filename(s) in the CSV didn't match any uploaded image ` +
            `(e.g. "${Array.from(unmatchedFilenames)[0]}"). Those rows will import without that photo. Continue?`,
        );

        if (!proceed) {
          setBulkBusy(false);

          setBulkStatus("");

          return;
        }
      }

      setBulkStatus("Importing properties...");

      const finalCsv = Papa.unparse(rows);

      const finalFile = new File([finalCsv], "bulk-import.csv", {
        type: "text/csv",
      });

      const formData = new FormData();

      formData.append("file", finalFile);

      const res = await fetch(
        "https://crm.fundsarthi.in/api/crm/import-properties",

        { method: "POST", body: formData },
      );

      const data = await res.json();

      alert(data.message || "Bulk import finished.");

      setShowBulkModal(false);

      setBulkCsvFile(null);

      setBulkImageFiles([]);

      fetchProperties();
    } catch (err) {
      console.error(err);

      alert("Bulk import failed. Check the CSV format and try again.");
    } finally {
      setBulkBusy(false);

      setBulkStatus("");
    }
  }; // FILTER + GLOBAL SEARCH

  // Search works across every property category:
  // Residential, Commercial, SCO and Plot.
  const filteredProperties = properties.filter((property) => {
    const matchesFilter = filter === "all" || property.status === filter;

    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return matchesFilter;
    }

    const searchableFields = [
      property.id,
      property.property_id,
      property.title,
      property.category,
      property.sub_property_type,
      property.type,
      property.purpose,
      property.location,
      property.locality,
      property.city,
      property.builder,
      property.project_name,
      property.name,
      property.mobile,
      property.email,
      property.owner_type,
      property.description,
    ];

    const matchesSearch = searchableFields.some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(search),
    );

    return matchesFilter && matchesSearch;
  });

  const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isAdmin || !editingProperty) return;

    setEditBusy(true);
    setEditError("");

    try {
      const token = localStorage.getItem("finloan_token");

      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch(
        `https://crm.fundsarthi.in/api/crm/update-property/${encodeURIComponent(editingProperty.id)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editingProperty),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not update property.");
      }

      setEditingProperty(null);
      await fetchProperties();
      alert("Property updated successfully.");
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setEditBusy(false);
    }
  };

  return (
    <div className="space-y-6">
            {/* HEADER */}     {" "}
      <div className="flex justify-between">
                <h1 className="text-2xl font-bold">Property Management</h1>     
         {" "}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg"
          style={{
            background: "linear-gradient(135deg, #0F766E 0%, #D4AF37 100%)",
          }}
        >
                    <Plus className="w-4 h-4" />          Add Property      
           {" "}
        </button>
               {" "}
        <button
          onClick={handleBulkDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-lg"
        >
                    Delete Selected        {" "}
        </button>
               {" "}
        <input
          type="file"
          accept=".csv"
          onChange={handleCSVUpload}
          className="hidden"
          id="csvUpload"
        />
               {" "}
        <label
          htmlFor="csvUpload"
          className="px-4 py-2 rounded-lg text-white cursor-pointer"
          style={{
            background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
          }}
        >
                    Import CSV        {" "}
        </label>
               {" "}
        <button
          onClick={() => {
            window.open(
              "https://crm.fundsarthi.in/api/crm/export-properties",

              "_blank",
            );
          }}
          className="px-4 py-2 rounded-lg text-white"
          style={{
            background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
          }}
        >
                    Export CSV        {" "}
        </button>
               {" "}
        <button
          onClick={() => setShowBulkModal(true)}
          className="px-4 py-2 rounded-lg text-white"
          style={{
            background: "linear-gradient(135deg,#7C3AED,#5B21B6)",
          }}
        >
                    Bulk Upload (CSV + Images)        {" "}
        </button>
             {" "}
      </div>
      {/* GLOBAL SEARCH */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by property name, ID, city, locality, builder, project, owner, mobile..."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {searchTerm && (
          <p className="text-sm text-gray-500 mt-2">
            Showing {filteredProperties.length} matching properties
          </p>
        )}
      </div>
           {" "}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
               {" "}
        <div className="flex items-center gap-3">
                   {" "}
          <input
            type="checkbox"
            checked={
              filteredProperties.length > 0 &&
              filteredProperties.every((p) => selectedIds.includes(p.id))
            }
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedIds(filteredProperties.map((p) => p.id));
              } else {
                setSelectedIds([]);
              }
            }}
          />
                   {" "}
          <span className="font-medium">
                        Select All ({filteredProperties.length})          {" "}
          </span>
                 {" "}
        </div>
               {" "}
        <span className="text-sm text-gray-500">
                    Selected: {selectedIds.length}       {" "}
        </span>
             {" "}
      </div>
            {/* GRID */}     {" "}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {" "}
        {filteredProperties.map((property: any) => (
          <div
            key={property.id}
            onClick={() => setSelectedProperty(property)}
            className="bg-white rounded-2xl border cursor-pointer overflow-hidden hover:shadow-md transition-all"
          >
                       {" "}
            <input
              type="checkbox"
              checked={selectedIds.includes(property.id)}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds((prev) => [...prev, property.id]);
                } else {
                  setSelectedIds((prev) =>
                    prev.filter((id) => id !== property.id),
                  );
                }
              }}
            />
                        {/* IMAGE */}           {" "}
            <div className="h-48 relative overflow-hidden">
                           {" "}
              {property.photos?.length > 0 ? (
                <img
                  src={property.photos[0]}
                  alt="property"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    background:
                      "linear-gradient(135deg, #0F766E 0%, #D4AF37 100%)",
                  }}
                />
              )}
                           {" "}
              <div className="absolute top-3 right-3">
                                <StatusBadge status={property.status} />       
                     {" "}
              </div>
                         {" "}
            </div>
                        {/* DETAILS */}           {" "}
            <div className="p-4">
                           {" "}
              <h3 className="font-semibold text-lg">
                                {property.title || "Untitled Property"}         
                   {" "}
              </h3>
                           {" "}
              <div className="flex items-center text-sm text-gray-500">
                                <MapPin className="w-4 h-4 mr-1" />             
                  {property.location}, {property.city}             {" "}
              </div>
                           {" "}
              <p className="text-xl font-bold mt-2">₹{property.price}</p>       
                    {/* FEATURES */}             {" "}
              <div className="flex gap-3 mt-2 text-sm text-gray-600">
                               {" "}
                {property.bedrooms && (
                  <span className="flex items-center gap-1">
                                        <Bed className="w-4 h-4" />{" "}
                    {property.bedrooms}                 {" "}
                  </span>
                )}
                               {" "}
                {property.bathrooms && (
                  <span className="flex items-center gap-1">
                                        <Bath className="w-4 h-4" />{" "}
                    {property.bathrooms}                 {" "}
                  </span>
                )}
                               {" "}
                {property.area && (
                  <span className="flex items-center gap-1">
                                        <Maximize className="w-4 h-4" />{" "}
                    {property.area}                 {" "}
                  </span>
                )}
                             {" "}
              </div>
                           {" "}
              <label className="flex items-center gap-2">
                               {" "}
                <input
                  type="checkbox"
                  checked={!!property.is_hot_deal}
                  onChange={async (e) => {
                    await fetch(
                      "https://crm.fundsarthi.in/api/crm/set-hot-deal",

                      {
                        method: "POST",

                        headers: {
                          "Content-Type": "application/json",
                        },

                        body: JSON.stringify({
                          id: property.id,

                          is_hot_deal: e.target.checked,
                        }),
                      },
                    );

                    fetchProperties();
                  }}
                />
                                <span>Mark as Hot Deal</span>             {" "}
              </label>
                           {" "}
              <label className="flex items-center gap-2">
                               {" "}
                <input
                  type="checkbox"
                  checked={!!property.is_trending}
                  onChange={async (e) => {
                    await fetch(
                      "https://crm.fundsarthi.in/api/crm/set-trending",

                      {
                        method: "POST",

                        headers: {
                          "Content-Type": "application/json",
                        },

                        body: JSON.stringify({
                          id: property.id,

                          is_trending: e.target.checked,
                        }),
                      },
                    );

                    fetchProperties();
                  }}
                />
                                <span>Mark as Trending</span>             {" "}
              </label>
                           {" "}
              <button
                onClick={async (e) => {
                  e.stopPropagation();

                  if (!window.confirm("Delete this property?")) return;

                  await fetch(
                    `https://crm.fundsarthi.in/api/crm/delete-property/${property.id}`,

                    {
                      method: "DELETE",
                    },
                  );

                  fetchProperties();
                }}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                                Delete              {" "}
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditError("");
                    setEditingProperty({
                      ...property,
                      title: property.title || "",
                      location: property.location || "",
                      city: property.city || "",
                      type: property.type || "Apartment",
                      price: String(property.price ?? ""),
                      bedrooms: String(property.bedrooms ?? ""),
                      bathrooms: String(property.bathrooms ?? ""),
                      area: String(property.area ?? ""),
                      description: property.description || "",
                      owner_name: property.owner_name || "",
                      owner_mobile: property.owner_mobile || "",
                      owner_email: property.owner_email || "",
                      purpose: property.purpose || "",
                    });
                  }}
                  className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-white"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              )}
                            {/* ACTIONS */}             {" "}
              {property.status === "pending" && (
                <div className="flex gap-2 mt-3">
                                   {" "}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();

                      handleApprove(property.id);
                    }}
                    className="flex-1 bg-green-600 text-white py-1 rounded"
                  >
                                        Approve                  {" "}
                  </button>
                                   {" "}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();

                      handleReject(property.id);
                    }}
                    className="flex-1 bg-red-600 text-white py-1 rounded"
                  >
                                        Reject                  {" "}
                  </button>
                                 {" "}
                </div>
              )}
                         {" "}
            </div>
                     {" "}
          </div>
        ))}
             {" "}
      </div>
            {/* DRAWER */}     {" "}
      {selectedProperty && (
        <PropertyDetailDrawer
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
            {/* ADD PROPERTY MODAL */}     {" "}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                   {" "}
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                       {" "}
            <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">Add Property</h2> 
                         {" "}
              <button onClick={() => setShowAddModal(false)}>
                                <X className="w-5 h-5" />             {" "}
              </button>
                         {" "}
            </div>
                       {" "}
            <form onSubmit={handleSubmit} className="space-y-3">
                           {" "}
              <input
                name="title"
                placeholder="Title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
                           {" "}
              <input
                name="location"
                placeholder="Locality / Area"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
                           {" "}
              <input
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleInputChange}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
                           {" "}
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2"
              >
                                <option value="Apartment">Apartment</option>   
                           {" "}
                <option value="Independent House">Independent House</option>   
                            <option value="Commercial">Commercial</option>     
                          <option value="SCO">SCO</option>               {" "}
                <option value="Plot">Plot</option>             {" "}
              </select>
                           {" "}
              <input
                name="price"
                type="number"
                placeholder="Price (₹)"
                value={formData.price}
                onChange={handleInputChange}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
                           {" "}
              <div className="grid grid-cols-2 gap-3">
                               {" "}
                <input
                  name="bedrooms"
                  type="number"
                  placeholder="Bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
                               {" "}
                <input
                  name="bathrooms"
                  type="number"
                  placeholder="Bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
                             {" "}
              </div>
                           {" "}
              <input
                name="area"
                type="number"
                placeholder="Area (sq ft)"
                value={formData.area}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2"
              />
                           {" "}
              <div className="flex gap-3 pt-2">
                               {" "}
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300"
                >
                                    Cancel                {" "}
                </button>
                               {" "}
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #0F766E 0%, #D4AF37 100%)",
                  }}
                >
                                    Add Property                {" "}
                </button>
                             {" "}
              </div>
                         {" "}
            </form>
                     {" "}
          </div>
                 {" "}
        </div>
      )}
            {/* BULK UPLOAD MODAL */}     {" "}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                   {" "}
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                       {" "}
            <div className="flex justify-between items-center mb-4">
                           {" "}
              <h2 className="text-lg font-bold">Bulk Upload Properties</h2>     
                     {" "}
              <button
                onClick={() => !bulkBusy && setShowBulkModal(false)}
                disabled={bulkBusy}
              >
                                <X className="w-5 h-5" />             {" "}
              </button>
                         {" "}
            </div>
                       {" "}
            <ol className="text-sm text-gray-600 list-decimal pl-5 mb-4 space-y-1">
                           {" "}
              <li>
                                Download the CSV template and fill one row per
                property. It                 covers Residential, Commercial, SCO
                and Plot in the same file                 &mdash; just leave
                columns blank that don't apply to a row's                
                category.              {" "}
              </li>
                           {" "}
              <li>
                                Give every property a unique{" "}
                <strong>property_id</strong> (e.g.                 PROP001).    
                         {" "}
              </li>
                           {" "}
              <li>
                                <strong>latitude</strong>/
                <strong>longitude</strong> are                 optional but
                recommended for accurate "nearby properties"                
                search.              {" "}
              </li>
                           {" "}
              <li>
                                In the <strong>photos</strong> column, list that
                property's                 image filenames separated by{" "}
                <code>|</code> (e.g.                {" "}
                <code>PROP001_1.jpg|PROP001_2.jpg</code>).              {" "}
              </li>
                           {" "}
              <li>
                                Select all image files below, then select your
                filled CSV.              {" "}
              </li>
                         {" "}
            </ol>
                       {" "}
            <button
              onClick={downloadBulkTemplate}
              className="w-full mb-4 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium"
            >
                            Download CSV Template            {" "}
            </button>
                       {" "}
            <div className="mb-4">
                           {" "}
              <label className="text-sm font-medium block mb-1">
                                Property Images ({bulkImageFiles.length}{" "}
                selected)              {" "}
              </label>
                           {" "}
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={bulkBusy}
                onChange={(e) =>
                  setBulkImageFiles(Array.from(e.target.files || []))
                }
                className="w-full text-sm"
              />
                         {" "}
            </div>
                       {" "}
            <div className="mb-4">
                           {" "}
              <label className="text-sm font-medium block mb-1">
                                CSV File{" "}
                {bulkCsvFile ? `(${bulkCsvFile.name})` : ""}             {" "}
              </label>
                           {" "}
              <input
                type="file"
                accept=".csv"
                disabled={bulkBusy}
                onChange={(e) => setBulkCsvFile(e.target.files?.[0] || null)}
                className="w-full text-sm"
              />
                         {" "}
            </div>
                       {" "}
            {bulkStatus && (
              <p className="text-sm text-primary mb-4">{bulkStatus}</p>
            )}
                       {" "}
            <div className="flex gap-3">
                           {" "}
              <button
                onClick={() => setShowBulkModal(false)}
                disabled={bulkBusy}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300"
              >
                                Cancel              {" "}
              </button>
                           {" "}
              <button
                onClick={handleBulkImport}
                disabled={bulkBusy || !bulkCsvFile}
                className="flex-1 px-4 py-2 rounded-lg text-white disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg,#7C3AED,#5B21B6)",
                }}
              >
                               {" "}
                {bulkBusy ? "Importing..." : "Start Bulk Upload"}           
                 {" "}
              </button>
                         {" "}
            </div>
                     {" "}
          </div>
                 {" "}
        </div>
      )}
         {" "}
      {isAdmin && editingProperty && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleEditSave}
            className="max-h-[90vh] w-full max-w-xl space-y-3 overflow-y-auto rounded-xl bg-white p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Property</h2>
              <button
                type="button"
                onClick={() => setEditingProperty(null)}
                disabled={editBusy}
                aria-label="Close edit form"
              >
                <X />
              </button>
            </div>

            {[
              ["title", "Property Title"],
              ["location", "Locality / Area"],
              ["city", "City"],
              ["price", "Price (₹)"],
              ["bedrooms", "Bedrooms"],
              ["bathrooms", "Bathrooms"],
              ["area", "Area (sq ft)"],
              ["owner_name", "Owner Name"],
              ["owner_mobile", "Owner Mobile"],
              ["owner_email", "Owner Email"],
              ["purpose", "Purpose"],
            ].map(([field, label]) => (
              <label key={field} className="block text-sm font-medium">
                {label}
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  type="text"
                  value={editingProperty[field] ?? ""}
                  onChange={(e) =>
                    setEditingProperty((prev: any) => ({
                      ...prev,
                      [field]: e.target.value,
                    }))
                  }
                  required={["title", "location", "city", "price"].includes(
                    field,
                  )}
                />
              </label>
            ))}

            <label className="block text-sm font-medium">
              Property Type
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={editingProperty.type || "Apartment"}
                onChange={(e) =>
                  setEditingProperty((prev: any) => ({
                    ...prev,
                    type: e.target.value,
                  }))
                }
              >
                <option>Apartment</option>
                <option>Independent House</option>
                <option>Commercial</option>
                <option>SCO</option>
                <option>Plot</option>
              </select>
            </label>

            <label className="block text-sm font-medium">
              Description
              <textarea
                className="mt-1 w-full rounded-lg border px-3 py-2"
                rows={3}
                value={editingProperty.description || ""}
                onChange={(e) =>
                  setEditingProperty((prev: any) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </label>

            {editError && <p className="text-sm text-red-600">{editError}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingProperty(null)}
                disabled={editBusy}
                className="flex-1 rounded-lg border px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editBusy}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {editBusy ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
