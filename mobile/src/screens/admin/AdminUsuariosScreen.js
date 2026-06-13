import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AdminListCard from "../../components/admin/AdminListCard";
import AdminListScreen from "../../components/admin/AdminListScreen";
import useRequireAuth from "../../hooks/useRequireAuth";
import {
  deleteUsuario,
  getUsuarios,
  inhabilitarUsuario,
} from "../../services/usuarios.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { MAX_LENGTHS } from "../../../../src/utils/constraints";
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
    const motivo = motivoInhabilitar.trim();
    if (!motivo) {
      setError("Ingresa un motivo de inhabilitación.");
      return;
    }
    if (motivo.length > MAX_LENGTHS.rol.motivo) {
      setError(`El motivo no puede exceder ${MAX_LENGTHS.rol.motivo} caracteres.`);
      return;
    }
    try {
      await inhabilitarUsuario(inhabilitarId, motivo);
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
              <Text style={styles.inhabilitarTitle}>Motivo de inhabilitación</Text>
              <TextInput
                style={styles.input}
                value={motivoInhabilitar}
                onChangeText={setMotivoInhabilitar}
                placeholder="Motivo (obligatorio)"
                maxLength={MAX_LENGTHS.rol.motivo}
                multiline
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
  addText: { color: "#fff", fontWeight: "800" },
  inhabilitarBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  inhabilitarTitle: { fontWeight: "700", marginBottom: 8, color: "#92400e" },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    textAlignVertical: "top",
  },
  inhabilitarActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  btnSecondary: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },
  btnSecondaryText: { fontWeight: "700", color: "#334155" },
  btnWarning: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.warning,
  },
  btnWarningText: { fontWeight: "700", color: "#fff" },
});
