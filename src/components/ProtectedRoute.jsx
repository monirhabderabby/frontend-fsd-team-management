import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import GlobalLoader from "./GlobalLoader.jsx";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <GlobalLoader label="Checking access..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
