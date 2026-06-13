import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AdminListCard from "../../components/admin/AdminListCard";
import AdminListScreen from "../../components/admin/AdminListScreen";
import FormField from "../../components/admin/FormField";
import useRequireAuth from "../../hooks/useRequireAuth";
import {
  deleteCliente,
  getClientes,
  inhabilitarCliente,
} from "../../services/clientes.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { getClienteDisplayName } from "../../utils/clientes";
import { confirmAdminAction, normalizeAdminList, pickGuid } from "../../utils/adminCollection";
import { MAX_LENGTHS } from "../../../../src/utils/constraints";
import { validateMotivoInhabilitacion } from "../../utils/text";
import { colors } from "../../styles/theme";

export default function AdminClientesScreen({ navigation }) {
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
      const response = await getClientes({ pagina: 1, limite: 100 });
      setItems(normalizeAdminList(response).items);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudieron cargar los clientes."));
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
    if (!(await confirmAdminAction("Eliminar", "¿Eliminar este cliente?"))) return;
    try {
      await deleteCliente(id);
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
      await inhabilitarCliente(inhabilitarId, motivoInhabilitar.trim());
      setInhabilitarId(null);
      setMotivoInhabilitar("");
      load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo inhabilitar."));
    }
  };

  return (
    <AdminListScreen
      title="Clientes"
      subtitle={`${items.length} registros`}
      items={items}
      loading={loading || bootstrapping}
      refreshing={refreshing}
      error={error}
      onRefresh={() => load(true)}
      onRetry={() => load()}
      keyExtractor={(item, index) =>
        pickGuid(item, "clienteGuid", "cliente_guid") ?? String(index)
      }
      ListHeaderComponent={
        <>
          <Pressable
            style={styles.addButton}
            onPress={() => navigation.navigate("AdminClienteForm")}
          >
            <Text style={styles.addText}>Nuevo cliente</Text>
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
                <Pressable style={styles.cancelBtn} onPress={() => setInhabilitarId(null)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.confirmBtn} onPress={onConfirmInhabilitar}>
                  <Text style={styles.addText}>Confirmar</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </>
      }
      renderItem={({ item }) => {
        const id = pickGuid(item, "clienteGuid", "cliente_guid");
        const actions = [
          { label: "Eliminar", variant: "danger", onPress: () => onDelete(id) },
        ];
        if (item.estado === "ACT") {
          actions.unshift({
            label: "Inhabilitar",
            variant: "warning",
            onPress: () => {
              setInhabilitarId(id);
              setMotivoInhabilitar("");
              setMotivoError("");
            },
          });
        }
        return (
          <AdminListCard
            title={getClienteDisplayName(item)}
            subtitle={`${item.tipoIdentificacion}: ${item.numeroIdentificacion}`}
            badge={item.estado || "ACT"}
            meta={`${item.correo || "-"} · ${item.telefono || "-"}`}
            onPress={() => navigation.navigate("AdminClienteForm", { id })}
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
    backgroundColor: colors.surface,
    gap: 8,
  },
  inhabilitarActions: { flexDirection: "row", gap: 8 },
  cancelBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.border,
  },
  confirmBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.warning,
  },
  cancelText: { fontWeight: "700", color: colors.text },
});
