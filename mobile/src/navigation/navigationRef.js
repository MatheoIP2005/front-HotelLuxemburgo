import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

const ADMIN_ROUTE_PREFIX = "Admin";

export const isAdminRouteName = (name) =>
  typeof name === "string" && name.startsWith(ADMIN_ROUTE_PREFIX);

export const resetToLogin = () => {
  if (!navigationRef.isReady()) return false;

  navigationRef.reset({
    index: 0,
    routes: [{ name: "Login" }],
  });
  return true;
};

export const resetToAdminHome = () => {
  if (!navigationRef.isReady()) return false;

  navigationRef.reset({
    index: 0,
    routes: [{ name: "AdminHome" }],
  });
  return true;
};
