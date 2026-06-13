import { Alert } from "react-native";
import { normalizeCollectionPayload } from "../../../src/shared/utils/api";

export const normalizeAdminList = (response, params = {}) =>
  normalizeCollectionPayload(response, {
    pagina: Number(params?.pagina) || 1,
    limite: Number(params?.limite) || 50,
  });

export const confirmAdminAction = (title, message) =>
  new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: "Confirmar", style: "destructive", onPress: () => resolve(true) },
    ]);
  });

export const pickGuid = (item, ...keys) => {
  for (const key of keys) {
    const value = item?.[key];
    if (value) return String(value);
  }
  return null;
};
