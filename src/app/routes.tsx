import { createBrowserRouter, Navigate } from "react-router";
import type { ReactNode } from "react";

import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import LoanApplications from "./pages/LoanApplications";
import Users from "./pages/Users";
import CRMUsers from "./pages/CRMUsers";
import Consultants from "./pages/Consultants";
import Bookings from "./pages/Bookings";
import Properties from "./pages/Properties";
import Partners from "./pages/Partners";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Banners from "./pages/Banners";
import PropertyEnquiries from "./pages/PropertyEnquiries";
import { useAuth } from "./context/AuthContext";

type Role = "admin" | "loan_viewer" | "property_viewer" | "vaastu_viewer";

const roleHome: Record<Role, string> = {
  admin: "/",
  loan_viewer: "/loans",
  property_viewer: "/properties",
  vaastu_viewer: "/consultants",
};

function RoleRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: ReactNode;
}) {
  const { user } = useAuth();
  const role = user?.role as Role | undefined;

  if (!role || !roleHome[role]) {
    return <Navigate to="/login" replace />;
  }

  if (role === "admin" || allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  return <Navigate to={roleHome[role]} replace />;
}

function RoleHome() {
  const { user } = useAuth();
  const role = user?.role as Role | undefined;

  if (!role || !roleHome[role]) {
    return <Navigate to="/login" replace />;
  }

  if (role === "admin") {
    return <Dashboard />;
  }

  return <Navigate to={roleHome[role]} replace />;
}

export const router = createBrowserRouter(
  [
    {
      path: "/login",
      Component: Login,
    },
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <RoleHome />,
        },
        {
          path: "loans",
          element: (
            <RoleRoute allowedRoles={["loan_viewer"]}>
              <LoanApplications />
            </RoleRoute>
          ),
        },
        {
          path: "users",
          element: (
            <RoleRoute allowedRoles={[]}>
              <Users />
            </RoleRoute>
          ),
        },
        {
          path: "crm-users",
          element: (
            <RoleRoute allowedRoles={[]}>
              <CRMUsers />
            </RoleRoute>
          ),
        },
        {
          path: "consultants",
          element: (
            <RoleRoute allowedRoles={["vaastu_viewer"]}>
              <Consultants />
            </RoleRoute>
          ),
        },
        {
          path: "bookings",
          element: (
            <RoleRoute allowedRoles={[]}>
              <Bookings />
            </RoleRoute>
          ),
        },
        {
          path: "properties",
          element: (
            <RoleRoute allowedRoles={["property_viewer"]}>
              <Properties />
            </RoleRoute>
          ),
        },
        {
          path: "partners",
          element: (
            <RoleRoute allowedRoles={[]}>
              <Partners />
            </RoleRoute>
          ),
        },
        {
          path: "settings",
          element: (
            <RoleRoute allowedRoles={[]}>
              <Settings />
            </RoleRoute>
          ),
        },
        {
          path: "banners",
          element: (
            <RoleRoute allowedRoles={[]}>
              <Banners />
            </RoleRoute>
          ),
        },
        {
          path: "property-enquiries",
          element: (
            <RoleRoute allowedRoles={[]}>
              <PropertyEnquiries />
            </RoleRoute>
          ),
        },
      ],
    },
  ],
  {
    basename: "/",
  },
);
