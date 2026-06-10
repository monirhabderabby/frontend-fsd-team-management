import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import RootLayout from "../layouts/RootLayout.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import GlobalLoader from "../components/GlobalLoader.jsx";

const Dashboard = lazy(() => import("../pages/Dashboard.jsx"));
const Projects = lazy(() => import("../pages/Projects.jsx"));
const Delivery = lazy(() => import("../pages/Delivery.jsx"));
const Ranking = lazy(() => import("../pages/Ranking.jsx"));
const Attendance = lazy(() => import("../pages/Attendance.jsx"));
const Reports = lazy(() => import("../pages/Reports.jsx"));
const Settings = lazy(() => import("../pages/Settings.jsx"));
const ServiceLines = lazy(() => import("../pages/ServiceLines.jsx"));
const Teams = lazy(() => import("../pages/Teams.jsx"));
const Employees = lazy(() => import("../pages/Employees.jsx"));
const Login = lazy(() => import("../pages/Login.jsx"));
const Register = lazy(() => import("../pages/Register.jsx"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("../pages/ResetPassword.jsx"));
const VerifyEmail = lazy(() => import("../pages/VerifyEmail.jsx"));
const NotFound = lazy(() => import("../pages/NotFound.jsx"));
const Announcement = lazy(() => import("@/pages/Announcement.jsx"));
const LearnTogether = lazy(() => import("../pages/LearnTogether.jsx"));

const withPageLoader = (element) => (
  <Suspense fallback={<GlobalLoader />}>{element}</Suspense>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withPageLoader(<Dashboard />) },
      {
        path: "service-lines",
        element: (
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            {withPageLoader(<ServiceLines />)}
          </ProtectedRoute>
        ),
      },
      {
        path: "teams",
        element: (
          <ProtectedRoute allowedRoles={["SUPER_ADMIN", "PROJECT_MANAGER"]}>
            {withPageLoader(<Teams />)}
          </ProtectedRoute>
        ),
      },
      {
        path: "employees",
        element: (
          <ProtectedRoute
            allowedRoles={["SUPER_ADMIN", "PROJECT_MANAGER", "TEAM_LEADER"]}
          >
            {withPageLoader(<Employees />)}
          </ProtectedRoute>
        ),
      },
      { path: "projects", element: withPageLoader(<Projects />) },
      {
        path: "delivery",
        element: (
          <ProtectedRoute
            allowedRoles={["SUPER_ADMIN", "PROJECT_MANAGER", "TEAM_LEADER"]}
          >
            {withPageLoader(<Delivery />)}
          </ProtectedRoute>
        ),
      },
      {
        path: "announcement",
        element: (
          <ProtectedRoute>
            {withPageLoader(<Announcement />)}
          </ProtectedRoute>
        ),
      },
      { path: "ranking", element: withPageLoader(<Ranking />) },
      { path: "attendance", element: withPageLoader(<Attendance />) },
      { path: "reports", element: withPageLoader(<Reports />) },
      { path: "settings", element: withPageLoader(<Settings />) },
      { path: "learn-together", element: withPageLoader(<LearnTogether />) },
    ],
  },
  { path: "/login", element: withPageLoader(<Login />) },
  { path: "/register", element: withPageLoader(<Register />) },
  { path: "/forgot-password", element: withPageLoader(<ForgotPassword />) },
  { path: "/reset-password", element: withPageLoader(<ResetPassword />) },
  { path: "/verify-email", element: withPageLoader(<VerifyEmail />) },
  { path: "*", element: withPageLoader(<NotFound />) },
]);

export default router;
