import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AdminListCard from "../../components/admin/AdminListCard";
import AdminListScreen from "../../components/admin/AdminListScreen";
import FormField from "../../components/admin/FormField";
import useRequireAuth from "../../hooks/useRequireAuth";
import {
  deleteUsuario,
  getUsuarios,
  inhabilitarUsuario,
} from "../../services/usuarios.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { MAX_LENGTHS } from "../../../../src/utils/constraints";
import { validateMotivoInhabilitacion } from "../../utils/text";
import { confirmAdminAction, normalizeAdminList, pickGuid } from "../../utils/adminCollection";
import { getUsuarioDisplayName, getUsuarioId } from "../../utils/usuarios";
import { colors } from "../../styles/theme";

export default function AdminUsuariosScreen({ navigation }) {
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [inhabilitarId, setInhabilitarId] = useState(null);
  const [motivoInhabilitar, setMotivoInhabilitar] = useState("");
  const [motivoError, setMotivoError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await getUsuarios({ pagina: 1, limite: 100 });
      setItems(normalizeAdminList(response).items);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudieron cargar los usuarios."));
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!bootstrapping && isAuthenticated) load();
  }, [bootstrapping, isAuthenticated, load]);

  const onDelete = async (id) => {
    if (!(await confirmAdminAction("Eliminar", "¿Eliminar este usuario?"))) return;
    try {
      await deleteUsuario(id);
      load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo eliminar."));
    }
  };

  const onConfirmInhabilitar = async () => {
    const motivoErr = validateMotivoInhabilitacion(motivoInhabilitar);
    if (motivoErr) {
      setMotivoError(motivoErr);
      return;
    }
    setMotivoError("");
    try {
      await inhabilitarUsuario(inhabilitarId, motivoInhabilitar.trim());
      setInhabilitarId(null);
      setMotivoInhabilitar("");
      load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo inhabilitar."));
    }
  };

  const onInhabilitarPress = async (id) => {
    if (!(await confirmAdminAction("Inhabilitar", "¿Inhabilitar este usuario?"))) return;
    setInhabilitarId(id);
    setMotivoInhabilitar("");
    setMotivoError("");
  };

  return (
    <AdminListScreen
      title="Usuarios"
      subtitle={`${items.length} registros`}
      items={items}
      loading={loading || bootstrapping}
      refreshing={refreshing}
      error={error}
      onRefresh={() => load(true)}
      onRetry={() => load()}
      keyExtractor={(item, index) => pickGuid(item, "usuarioGuid") ?? String(index)}
      ListHeaderComponent={
        <>
          <Pressable
            style={styles.addButton}
            onPress={() => navigation.navigate("AdminUsuarioForm")}
          >
            <Text style={styles.addText}>Nuevo usuario</Text>
          </Pressable>
          {inhabilitarId ? (
            <View style={styles.inhabilitarBox}>
              <FormField
                label="Motivo de inhabilitación"
                value={motivoInhabilitar}
                onChangeText={(value) => {
                  setMotivoInhabilitar(value);
                  if (motivoError) setMotivoError("");
                }}
                placeholder="Motivo (obligatorio)"
                maxLength={MAX_LENGTHS.rol.motivo}
                multiline
                error={motivoError}
              />
              <View style={styles.inhabilitarActions}>
                <Pressable style={styles.btnSecondary} onPress={() => setInhabilitarId(null)}>
                  <Text style={styles.btnSecondaryText}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.btnWarning} onPress={onConfirmInhabilitar}>
                  <Text style={styles.btnWarningText}>Confirmar</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </>
      }
      renderItem={({ item }) => {
        const id = getUsuarioId(item);
        const actions = [
          {
            label: "Editar",
            onPress: () => navigation.navigate("AdminUsuarioForm", { id }),
          },
          {
            label: "Roles",
            onPress: () => navigation.navigate("AdminUsuarioRoles", { id }),
          },
        ];
        if (item.estadoUsuario === "ACT") {
          actions.push({
            label: "Inhabilitar",
            variant: "warning",
            onPress: () => onInhabilitarPress(id),
          });
        }
        actions.push({
          label: "Eliminar",
          variant: "danger",
          onPress: () => onDelete(id),
        });

        return (
          <AdminListCard
            title={item.username || "-"}
            subtitle={getUsuarioDisplayName(item)}
            badge={item.estadoUsuario || "-"}
            meta={item.correo || "-"}
            onPress={() => navigation.navigate("AdminUsuarioForm", { id })}
            actions={actions}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  addButton: {
    marginBottom: 12,
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  addText: { color: colors.onPrimary, fontWeight: "800" },
  inhabilitarBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    gap: 8,
  },
  inhabilitarActions: { flexDirection: "row", gap: 8 },
  btnSecondary: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondaryBg,
  },
  btnSecondaryText: { fontWeight: "700", color: colors.textSecondary },
  btnWarning: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.warning,
  },
  btnWarningText: { fontWeight: "700", color: colors.onPrimary },
});
