import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function useRequireAuth(navigation) {
  const { isAuthenticated, bootstrapping } = useAuth();

  useEffect(() => {
    if (bootstrapping) return;
    if (!isAuthenticated) {
      navigation.replace("Login");
    }
  }, [bootstrapping, isAuthenticated, navigation]);

  return { isAuthenticated, bootstrapping };
}
