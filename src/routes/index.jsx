import { createBrowserRouter } from "react-router";
import RootLayout from "../layouts/RootLayout.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Projects from "../pages/Projects.jsx";
import Delivery from "../pages/Delivery.jsx";
import Ranking from "../pages/Ranking.jsx";
import Attendance from "../pages/Attendance.jsx";
import Reports from "../pages/Reports.jsx";
import Settings from "../pages/Settings.jsx";
import ServiceLines from "../pages/ServiceLines.jsx";
import Teams from "../pages/Teams.jsx";
import Employees from "../pages/Employees.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import ForgotPassword from "../pages/ForgotPassword.jsx";
import ResetPassword from "../pages/ResetPassword.jsx";
import VerifyEmail from "../pages/VerifyEmail.jsx";
import NotFound from "../pages/NotFound.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import Announcement from "@/pages/Announcement.jsx";
import LearnTogether from "../pages/LearnTogether.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      {
        path: "service-lines",
        element: (
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <ServiceLines />
          </ProtectedRoute>
        ),
      },
      {
        path: "teams",
        element: (
          <ProtectedRoute allowedRoles={["SUPER_ADMIN", "PROJECT_MANAGER"]}>
            <Teams />
          </ProtectedRoute>
        ),
      },
      {
        path: "employees",
        element: (
          <ProtectedRoute
            allowedRoles={["SUPER_ADMIN", "PROJECT_MANAGER", "TEAM_LEADER"]}
          >
            <Employees />
          </ProtectedRoute>
        ),
      },
      { path: "projects", element: <Projects /> },
      {
        path: "delivery",
        element: (
          <ProtectedRoute
            allowedRoles={["SUPER_ADMIN", "PROJECT_MANAGER", "TEAM_LEADER"]}
          >
            <Delivery />
          </ProtectedRoute>
        ),
      },
      {
        path: "announcement",
        element: (
          <ProtectedRoute>
            <Announcement />
          </ProtectedRoute>
        ),
      },
      { path: "ranking", element: <Ranking /> },
      { path: "attendance", element: <Attendance /> },
      { path: "reports", element: <Reports /> },
      { path: "settings", element: <Settings /> },
      { path: "learn-together", element: <LearnTogether /> },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/verify-email", element: <VerifyEmail /> },
  { path: "*", element: <NotFound /> },
]);

export default router;
