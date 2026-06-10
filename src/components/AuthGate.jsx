import { useAuth } from "../context/AuthContext.jsx";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../utils/apiClient.js";
import GlobalLoader from "./GlobalLoader.jsx";
import MaintenanceMode from "./MaintenanceMode.jsx";

const AuthGate = ({ children }) => {
  const { loading } = useAuth();
  const isProduction = import.meta.env.MODE === "production";

  const { data: maintenanceData, isLoading: maintenanceLoading } = useQuery({
    queryKey: ["app-settings", "maintenance"],
    queryFn: () => apiRequest("/api/app-settings/maintenance"),
    enabled: isProduction,
    retry: false,
  });

  if (loading || (isProduction && maintenanceLoading)) {
    return <GlobalLoader label="Checking session..." />;
  }

  if (isProduction && maintenanceData?.enabled) {
    return <MaintenanceMode />;
  }

  return children;
};

export default AuthGate;
