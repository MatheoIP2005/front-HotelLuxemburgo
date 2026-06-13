import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { isAdminRouteName, navigationRef, resetToLogin } from "./navigationRef";

const PUBLIC_ROUTES = new Set([
  "Search",
  "AccommodationDetail",
  "BookingForm",
  "Payment",
  "Confirmation",
  "Login",
]);

export default function AuthNavigationSync() {
  const { isAuthenticated, bootstrapping } = useAuth();

  useEffect(() => {
    if (bootstrapping || isAuthenticated || !navigationRef.isReady()) return;

    const routeName = navigationRef.getCurrentRoute()?.name;
    if (!routeName || PUBLIC_ROUTES.has(routeName)) return;
    if (isAdminRouteName(routeName)) {
      resetToLogin();
    }
  }, [bootstrapping, isAuthenticated]);

  return null;
}
