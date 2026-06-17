import { Alert } from "react-native";
import { normalizeCollectionPayload } from "../../../src/shared/utils/api";

export const filterSafeList = (items) =>
  (Array.isArray(items) ? items : []).filter(Boolean);

export const withSafeItems = (collection) => ({
  ...collection,
  items: filterSafeList(collection?.items),
});

export const normalizeAdminList = (response, params = {}) =>
  withSafeItems(
    normalizeCollectionPayload(response, {
      pagina: Number(params?.pagina) || 1,
      limite: Number(params?.limite) || 50,
    })
  );

export const ensureLoadedEntity = (
  data,
  setError,
  message = "Registro no encontrado."
) => {
  if (data) return true;
  setError(message);
  return false;
};

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

export const createSafeRenderItem = (renderItem) => (props) =>
  props.item ? renderItem(props) : null;
