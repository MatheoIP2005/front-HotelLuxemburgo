import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AdminDetailSection from "../../components/admin/AdminDetailSection";
import useRequireAuth from "../../hooks/useRequireAuth";
import { getAuditoriaItem } from "../../services/auditoria.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import {
  formatAuditoriaDateTime,
  formatAuditoriaJson,
  getAuditoriaDatosAnteriores,
  getAuditoriaDatosNuevos,
  getAuditoriaEntidadGuid,
  getAuditoriaId,
  getAuditoriaIdRegistro,
  getAuditoriaIp,
  getAuditoriaOperacion,
  getAuditoriaServicio,
  getAuditoriaTabla,
  getAuditoriaUsuario,
} from "../../utils/auditoria";
import { colors, shadow } from "../../styles/theme";

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value ?? "-"}</Text>
    </View>
  );
}

function JsonBlock({ title, value }) {
  const formatted = formatAuditoriaJson(value);
  return (
    <AdminDetailSection title={title}>
      {formatted ? (
        <View style={styles.jsonBox}>
          <Text selectable style={styles.jsonText}>
            {formatted}
          </Text>
        </View>
      ) : (
        <Text style={styles.muted}>Sin datos.</Text>
      )}
    </AdminDetailSection>
  );
}

export default function AdminAuditoriaDetailScreen({ navigation, route }) {
  const { id } = route.params ?? {};
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const data = await getAuditoriaItem(id);
      setEvento(data);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo cargar el evento de auditoría."));
      setEvento(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!bootstrapping && isAuthenticated) load();
  }, [bootstrapping, isAuthenticated, load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.muted}>Cargando evento...</Text>
      </View>
    );
  }

  if (!evento) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "Evento no encontrado."}</Text>
      </View>
    );
  }

  const fecha = evento.fechaEventoUtc ?? evento.fecha_evento_utc;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Evento de auditoría</Text>
      <Text style={styles.readOnly}>Solo lectura · no se publican eventos desde móvil</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AdminDetailSection title="Resumen">
        <DetailRow label="GUID" value={getAuditoriaId(evento)} />
        <DetailRow label="Servicio origen" value={getAuditoriaServicio(evento)} />
        <DetailRow label="Tabla" value={getAuditoriaTabla(evento)} />
        <DetailRow label="Operación" value={getAuditoriaOperacion(evento)} />
        <DetailRow label="Usuario" value={getAuditoriaUsuario(evento)} />
        <DetailRow
          label="Usuario GUID"
          value={evento.usuarioGuid ?? evento.usuario_guid ?? "-"}
        />
        <DetailRow label="Fecha (UTC)" value={formatAuditoriaDateTime(fecha)} />
        <DetailRow label="IP origen" value={getAuditoriaIp(evento)} />
        <DetailRow label="ID registro" value={getAuditoriaIdRegistro(evento)} />
        <DetailRow label="Entidad GUID" value={getAuditoriaEntidadGuid(evento) ?? "-"} />
      </AdminDetailSection>

      <JsonBlock title="Datos anteriores" value={getAuditoriaDatosAnteriores(evento)} />
      <JsonBlock title="Datos nuevos" value={getAuditoriaDatosNuevos(evento)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "800", color: colors.text },
  readOnly: { color: colors.muted, marginBottom: 4, fontSize: 13 },
  muted: { color: colors.muted },
  error: { color: colors.danger, fontWeight: "600" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondaryBg,
  },
  rowLabel: { color: colors.muted, flex: 1 },
  rowValue: {
    color: colors.text,
    fontWeight: "700",
    flex: 1.2,
    textAlign: "right",
  },
  jsonBox: {
    backgroundColor: colors.nav,
    borderRadius: 8,
    padding: 12,
    ...shadow,
  },
  jsonText: {
    color: colors.secondaryBg,
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18,
  },
});
