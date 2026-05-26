import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function AdminRoutes({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
