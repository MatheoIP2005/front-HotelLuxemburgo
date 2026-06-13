import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AdminListCard from "../../components/admin/AdminListCard";
import AdminListScreen from "../../components/admin/AdminListScreen";
import useRequireAuth from "../../hooks/useRequireAuth";
import { anularFactura, getFacturas } from "../../services/facturas.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { MAX_LENGTHS } from "../../../../src/utils/constraints";
import { confirmAdminAction, pickGuid } from "../../utils/adminCollection";
import {
  canAnularFactura,
  canPayFactura,
  formatFacturaMoney,
  getFacturaId,
  normalizeFacturasList,
} from "../../utils/facturas";
import { colors } from "../../styles/theme";

export default function AdminFacturasScreen({ navigation }) {
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [anularId, setAnularId] = useState(null);
  const [motivoAnular, setMotivoAnular] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await getFacturas({ pagina: 1, limite: 100 });
      setItems(normalizeFacturasList(response, { pagina: 1, limite: 100 }).items);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudieron cargar las facturas."));
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!bootstrapping && isAuthenticated) load();
  }, [bootstrapping, isAuthenticated, load]);

  const onConfirmAnular = async () => {
    const motivo = motivoAnular.trim();
    if (!motivo) {
      setError("Ingresa un motivo de anulación.");
      return;
    }
    if (motivo.length > MAX_LENGTHS.factura.motivo) {
      setError(`El motivo no puede exceder ${MAX_LENGTHS.factura.motivo} caracteres.`);
      return;
    }
    try {
      await anularFactura(anularId, motivo);
      setAnularId(null);
      setMotivoAnular("");
      load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo anular la factura."));
    }
  };

  const onAnularPress = async (id) => {
    if (!(await confirmAdminAction("Anular", "¿Anular esta factura?"))) return;
    setAnularId(id);
    setMotivoAnular("");
  };

  return (
    <AdminListScreen
      title="Facturas"
      subtitle={`${items.length} registros`}
      items={items}
      loading={loading || bootstrapping}
      refreshing={refreshing}
      error={error}
      onRefresh={() => load(true)}
      onRetry={() => load()}
      keyExtractor={(item, index) =>
        pickGuid(item, "facturaGuid", "guidFactura") ?? String(index)
      }
      ListHeaderComponent={
        <>
          <Pressable
            style={styles.addButton}
            onPress={() => navigation.navigate("AdminFacturaDetail", { mode: "generate" })}
          >
            <Text style={styles.addText}>Generar factura desde reserva</Text>
          </Pressable>
          {anularId ? (
            <View style={styles.anularBox}>
              <Text style={styles.anularTitle}>Motivo de anulación</Text>
              <TextInput
                style={styles.input}
                value={motivoAnular}
                onChangeText={setMotivoAnular}
                placeholder="Motivo (obligatorio)"
                maxLength={MAX_LENGTHS.factura.motivo}
                multiline
              />
              <View style={styles.anularActions}>
                <Pressable style={styles.btnSecondary} onPress={() => setAnularId(null)}>
                  <Text style={styles.btnSecondaryText}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.btnDanger} onPress={onConfirmAnular}>
                  <Text style={styles.btnDangerText}>Confirmar anulación</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </>
      }
      renderItem={({ item }) => {
        const id = getFacturaId(item);
        return (
          <AdminListCard
            title={item.numeroFactura || "Sin número"}
            subtitle={`${item.tipoFactura || "-"} · Total ${formatFacturaMoney(item.total)}`}
            badge={item.estado || "-"}
            meta={`Saldo: ${formatFacturaMoney(item.saldoPendiente)}`}
            onPress={() => navigation.navigate("AdminFacturaDetail", { id })}
            actions={[
              ...(canPayFactura(item)
                ? [
                    {
                      label: "Pagar saldo",
                      onPress: () =>
                        navigation.navigate("AdminPagoForm", { facturaGuid: id }),
                    },
                  ]
                : []),
              ...(canAnularFactura(item)
                ? [
                    {
                      label: "Anular",
                      variant: "danger",
                      onPress: () => onAnularPress(id),
                    },
                  ]
                : []),
            ]}
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
  anularBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fdba74",
  },
  anularTitle: { fontWeight: "700", marginBottom: 8, color: "#9a3412" },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    textAlignVertical: "top",
  },
  anularActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  btnSecondary: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },
  btnSecondaryText: { fontWeight: "700", color: "#334155" },
  btnDanger: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc2626",
  },
  btnDangerText: { fontWeight: "700", color: "#fff" },
});
