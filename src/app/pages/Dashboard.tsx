import { useMemo, useEffect, useState } from "react";
import {
  TrendingUp,
  FileCheck,
  FileClock,
  Users,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import KPICard from "../components/KPICard";
import { useAuth } from "../context/AuthContext";

const API_BASE = "https://crm.fundsarthi.in";

type AnyRecord = Record<string, any>;

function extractArray(
  data: any,
  keys: string[] = []
): AnyRecord[] {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}

export default function Dashboard() {
  const { token, user } = useAuth();

  const [loans, setLoans] = useState<AnyRecord[]>([]);
  const [users, setUsers] = useState<AnyRecord[]>([]);
  const [properties, setProperties] = useState<AnyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // =========================================================
  // FETCH ALL DASHBOARD DATA
  // =========================================================

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setLoadError("Your session token is missing. Please log in again.");
      return;
    }

    const controller = new AbortController();

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const fetchEndpoint = async (path: string) => {
      const response = await fetch(`${API_BASE}${path}`, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      if (response.status === 401) {
        throw new Error(
          "Your session has expired. Please log out and log in again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "Your account does not have permission to access some dashboard data."
        );
      }

      if (!response.ok) {
        throw new Error(
          `${path} returned HTTP ${response.status}`
        );
      }

      return response.json();
    };

    const loadDashboard = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const results = await Promise.allSettled([
          fetchEndpoint("/api/crm/loans"),
          fetchEndpoint("/api/crm/users"),
          fetchEndpoint("/api/crm/properties"),
        ]);

        if (controller.signal.aborted) return;

        const [loanResult, userResult, propertyResult] = results;

        const errors: string[] = [];

        if (loanResult.status === "fulfilled") {
          setLoans(
            extractArray(loanResult.value, [
              "data",
              "loans",
              "results",
            ])
          );
        } else {
          setLoans([]);
          errors.push(
            `Loans: ${loanResult.reason?.message || "Failed to load"}`
          );
          console.error("Loan API Error:", loanResult.reason);
        }

        if (userResult.status === "fulfilled") {
          setUsers(
            extractArray(userResult.value, [
              "data",
              "users",
              "results",
            ])
          );
        } else {
          setUsers([]);
          errors.push(
            `Users: ${userResult.reason?.message || "Failed to load"}`
          );
          console.error("Users API Error:", userResult.reason);
        }

        if (propertyResult.status === "fulfilled") {
          const propertyList = extractArray(
            propertyResult.value,
            ["data", "properties", "results"]
          );

          setProperties(propertyList);

          console.log("PROPERTY API RESPONSE:", propertyResult.value);
          console.log("PROPERTY LIST:", propertyList);
        } else {
          setProperties([]);
          errors.push(
            `Properties: ${propertyResult.reason?.message || "Failed to load"}`
          );
          console.error(
            "Property API Error:",
            propertyResult.reason
          );
        }

        if (errors.length > 0) {
          setLoadError(errors.join(" | "));
        }
      } catch (error: any) {
        if (!controller.signal.aborted) {
          setLoadError(
            error?.message || "Unable to load dashboard data."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => controller.abort();
  }, [token]);

  // =========================================================
  // KPI CALCULATIONS
  // =========================================================

  const totalLoans = loans.length;

  const approvedLoans = loans.filter(
    (loan) =>
      String(loan.status || "").toLowerCase() === "approved"
  ).length;

  const pendingLoans = loans.filter((loan) => {
    const status = String(loan.status || "")
      .toLowerCase()
      .replace(/_/g, "-");

    return (
      status === "in-process" ||
      status === "in process" ||
      status === "new"
    );
  }).length;

  const totalUsers = users.length;

  // =========================================================
  // LOAN STATUS PIE
  // =========================================================

  const statusData = useMemo(
    () => [
      {
        name: "New",
        value: loans.filter(
          (loan) =>
            String(loan.status || "").toLowerCase() === "new"
        ).length,
        color: "#3B82F6",
        id: "status-new",
      },
      {
        name: "In Process",
        value: loans.filter((loan) => {
          const status = String(loan.status || "")
            .toLowerCase()
            .replace(/_/g, "-");

          return (
            status === "in-process" ||
            status === "in process"
          );
        }).length,
        color: "#F59E0B",
        id: "status-in-process",
      },
      {
        name: "Approved",
        value: loans.filter(
          (loan) =>
            String(loan.status || "").toLowerCase() ===
            "approved"
        ).length,
        color: "#10B981",
        id: "status-approved",
      },
      {
        name: "Rejected",
        value: loans.filter(
          (loan) =>
            String(loan.status || "").toLowerCase() ===
            "rejected"
        ).length,
        color: "#EF4444",
        id: "status-rejected",
      },
    ],
    [loans]
  );

  // =========================================================
  // PROPERTY CITY PIE
  // =========================================================

  const cityData = useMemo(() => {
    const cityCounts: Record<string, number> = {};

    properties.forEach((property) => {
      const rawCity =
        property?.city ||
        property?.location_city ||
        property?.locationCity ||
        "";

      let city = String(rawCity)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

      if (!city) return;

      if (city === "gurgaon" || city === "gurugram") {
        city = "Gurugram";
      } else {
        city = city.charAt(0).toUpperCase() + city.slice(1);
      }

      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });

    return Object.entries(cityCounts)
      .map(([name, value], index) => ({
        name,
        value,
        id: `city-${index}`,
      }))
      .sort((a, b) => b.value - a.value);
  }, [properties]);

  const cityColors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EF4444",
    "#06B6D4",
    "#EC4899",
    "#84CC16",
    "#F97316",
    "#6366F1",
  ];

  // =========================================================
  // MONTHLY LOAN DATA
  // =========================================================

  const monthlyData = useMemo(() => {
    const months: Record<
      string,
      {
        month: string;
        applications: number;
        approved: number;
        sortDate: number;
      }
    > = {};

    loans.forEach((loan) => {
      const rawDate =
        loan.appliedDate ||
        loan.created_at ||
        loan.createdAt;

      if (!rawDate) return;

      const date = new Date(rawDate);

      if (isNaN(date.getTime())) return;

      const monthName = date.toLocaleString("default", {
        month: "short",
      });

      const year = date.getFullYear();
      const monthIndex = date.getMonth();
      const key = `${year}-${monthIndex}`;

      if (!months[key]) {
        months[key] = {
          month: `${monthName} ${year}`,
          applications: 0,
          approved: 0,
          sortDate: new Date(year, monthIndex, 1).getTime(),
        };
      }

      months[key].applications += 1;

      if (
        String(loan.status || "").toLowerCase() === "approved"
      ) {
        months[key].approved += 1;
      }
    });

    return Object.values(months)
      .sort((a, b) => a.sortDate - b.sortDate)
      .map(({ month, applications, approved }) => ({
        month,
        applications,
        approved,
      }));
  }, [loans]);

  // =========================================================
  // RECENT LOANS
  // =========================================================

  const recentLoans = useMemo(
    () =>
      [...loans]
        .sort((a, b) => {
          const dateA = new Date(
            a.appliedDate || a.created_at || a.createdAt || 0
          ).getTime();

          const dateB = new Date(
            b.appliedDate || b.created_at || b.createdAt || 0
          ).getTime();

          return dateB - dateA;
        })
        .slice(0, 4),
    [loans]
  );

  // =========================================================
  // RECENT USERS
  // =========================================================

  const recentUsers = useMemo(
    () =>
      [...users]
        .sort((a, b) => {
          const dateA = new Date(
            a.created_at || a.createdAt || 0
          ).getTime();

          const dateB = new Date(
            b.created_at || b.createdAt || 0
          ).getTime();

          return dateB - dateA;
        })
        .slice(0, 4),
    [users]
  );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>

        <p className="text-gray-500 mt-1">
          Welcome back, {user?.name || "User"}! Here's what's
          happening with your loan platform.
        </p>
      </div>

      {/* LOADING / ERROR */}

      {loading && (
        <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">
          Loading dashboard data...
        </div>
      )}

      {!loading && loadError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {loadError}
        </div>
      )}

      {/* KPI CARDS */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Loan Applications"
          value={totalLoans}
          change={loading ? "Loading..." : "+ live data"}
          changeType="positive"
          icon={TrendingUp}
          iconColor="from-blue-500 to-blue-600"
        />

        <KPICard
          title="Approved Loans"
          value={approvedLoans}
          change={loading ? "Loading..." : "Live"}
          changeType="positive"
          icon={FileCheck}
          iconColor="from-green-500 to-green-600"
        />

        <KPICard
          title="Pending Applications"
          value={pendingLoans}
          change={loading ? "Loading..." : "Live"}
          changeType="positive"
          icon={FileClock}
          iconColor="from-orange-500 to-orange-600"
        />

        <KPICard
          title="Total Users"
          value={totalUsers}
          change={loading ? "Loading..." : "Live"}
          changeType="positive"
          icon={Users}
          iconColor="from-purple-500 to-purple-600"
        />
      </div>

      {/* PIE CHARTS */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LOAN STATUS */}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">
            Loan Status Distribution
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name} ${((percent || 0) * 100).toFixed(0)}%`
                }
              >
                {statusData.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* CITY-WISE PROPERTIES */}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">
            Properties by City
          </h3>

          {cityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cityData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                >
                  {cityData.map((entry, index) => (
                    <Cell
                      key={entry.id}
                      fill={cityColors[index % cityColors.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-sm text-gray-500">
                {loading
                  ? "Loading properties..."
                  : "No property data found."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MONTHLY LOAN APPLICATIONS */}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">
          Monthly Loan Applications
        </h3>

        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Bar
                dataKey="applications"
                fill="#3B82F6"
                name="Applications"
              />

              <Bar
                dataKey="approved"
                fill="#10B981"
                name="Approved"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm text-gray-500">
              {loading
                ? "Loading loan applications..."
                : "No loan application data found."}
            </p>
          </div>
        )}
      </div>

      {/* RECENT DATA */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RECENT LOANS */}

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-semibold mb-4">
            Recent Loan Applications
          </h3>

          {recentLoans.map((loan, index) => (
            <div
              key={loan.id ?? index}
              className="p-3 bg-gray-50 rounded-xl mb-2"
            >
              <p className="font-medium">
                {loan.userName || loan.name || "Unknown User"}
              </p>

              <p className="text-sm text-gray-500">
                ₹
                {(
                  Number(loan.loanAmount || 0) / 100000
                ).toFixed(1)}
                L - {loan.loanType || "Loan"}
              </p>
            </div>
          ))}

          {!loading && recentLoans.length === 0 && (
            <p className="text-sm text-gray-500">
              No loan applications found.
            </p>
          )}
        </div>

        {/* NEW USERS */}

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-semibold mb-4">New Users</h3>

          {recentUsers.map((item, index) => (
            <div
              key={item.id ?? index}
              className="p-3 bg-gray-50 rounded-xl mb-2"
            >
              <p className="font-medium">
                {item.name || "Unknown User"}
              </p>

              <p className="text-sm text-gray-500">
                {item.city || "Unknown City"} -{" "}
                {item.employment || "N/A"}
              </p>
            </div>
          ))}

          {!loading && recentUsers.length === 0 && (
            <p className="text-sm text-gray-500">
              No users found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}