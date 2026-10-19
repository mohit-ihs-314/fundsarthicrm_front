import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  FileText,
  Users,
  UserCheck,
  ShieldCheck,
  Calendar,
  Home,
  Handshake,
  Images,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Menu,
  LogOut,
  User,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
  {
    path: "/loans",
    label: "Loan Applications",
    icon: FileText,
    roles: ["admin", "loan_viewer"],
  },
  { path: "/users", label: "Users", icon: Users, roles: ["admin"] },
  {
    path: "/consultants",
    label: "Consultants",
    icon: UserCheck,
    roles: ["admin", "vaastu_viewer"],
  },
  { path: "/bookings", label: "Bookings", icon: Calendar, roles: ["admin"] },
  {
    path: "/properties",
    label: "Properties",
    icon: Home,
    roles: ["admin", "property_viewer"],
  },
  { path: "/banners", label: "Banners", icon: Images, roles: ["admin"] },
  { path: "/partners", label: "Partners", icon: Handshake, roles: ["admin"] },
  { path: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
  {
    path: "/property-enquiries",
    label: "Property Enquiries",
    icon: MessageSquare,
    roles: ["admin"],
  },
  {
    path: "/crm-users",
    label: "CRM Users",
    icon: ShieldCheck,
    roles: ["admin"],
  },
];

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  loan_viewer: "Loan Viewer",
  property_viewer: "Property Viewer",
  vaastu_viewer: "Vaastu Viewer",
};

export default function DashboardLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();

  const role = user?.role || "";
  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <aside
        className={`fixed left-0 top-0 z-40 h-full bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex items-center gap-3 p-6 border-b border-gray-200">
          <div className="w-50 h-20 rounded-2xl overflow-hidden flex items-center justify-center bg-white shadow-sm">
            <img
              src="https://i.postimg.cc/NfdzfQwM/logo2_removebg_preview.png"
              alt="FinLoan Logo"
              className="w-full h-full object-contain p-1"
            />
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" &&
                location.pathname.startsWith(item.path + "/"));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "text-white shadow-lg"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                style={
                  isActive
                    ? {
                        background:
                          "linear-gradient(135deg, #0F766E 0%, #D4AF37 100%)",
                      }
                    : {}
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>

              {role === "admin" && (
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search applications, users, properties..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {role === "admin" && (
                <button
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, #0F766E 0%, #D4AF37 100%)",
                    }}
                  >
                    <span className="text-white text-sm font-semibold">
                      {user?.name?.charAt(0) || "U"}
                    </span>
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {roleLabels[role] || "Viewer"}
                    </p>
                  </div>

                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />

                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>

                      <div className="py-1">
                        {role === "admin" && (
                          <Link
                            to="/settings"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <User className="w-4 h-4" />
                            Profile Settings
                          </Link>
                        )}

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
