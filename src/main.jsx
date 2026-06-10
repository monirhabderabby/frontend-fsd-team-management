import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import router from "./routes/index.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import AuthGate from "./components/AuthGate.jsx";
import { queryClient } from "./lib/queryClient.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate>
          <RouterProvider router={router} />
        </AuthGate>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
