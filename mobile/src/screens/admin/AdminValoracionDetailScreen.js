import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import SelectField from "../../components/admin/SelectField";
import useRequireAuth from "../../hooks/useRequireAuth";
import {
  deleteValoracion,
  getValoracion,
  moderarValoracion,
  responderValoracion,
} from "../../services/valoraciones.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { VALORACION_MODERATION_STATES } from "../../../../src/utils/constraints";
import { confirmAdminAction } from "../../utils/adminCollection";
import { colors, shadow } from "../../styles/theme";

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value ?? "-"}</Text>
    </View>
  );
}

export default function AdminValoracionDetailScreen({ navigation, route }) {
  const { id } = route.params ?? {};
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [valoracion, setValoracion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [estadoModeracion, setEstadoModeracion] = useState("PUB");
  const [respuestaHotel, setRespuestaHotel] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const data = await getValoracion(id);
      setValoracion(data);
      setEstadoModeracion(data?.estadoValoracion ?? "PUB");
      setRespuestaHotel(data?.respuestaHotel ?? "");
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo cargar la valoración."));
      setValoracion(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!bootstrapping && isAuthenticated) load();
  }, [bootstrapping, isAuthenticated, load]);

  const handleModerar = async () => {
    setActionLoading(true);
    setError("");
    try {
      await moderarValoracion(id, {
        estadoValoracion: estadoModeracion,
        rowVersion: valoracion?.rowVersion ?? null,
      });
      Alert.alert("Moderación", "Estado actualizado.");
      await load();
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo moderar."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResponder = async () => {
    if (!respuestaHotel.trim()) {
      setError("Ingresa una respuesta del hotel.");
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      await responderValoracion(id, {
        respuestaHotel: respuestaHotel.trim(),
        rowVersion: valoracion?.rowVersion ?? null,
      });
      Alert.alert("Respuesta", "Respuesta registrada.");
      await load();
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo responder."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!(await confirmAdminAction("Eliminar", "¿Eliminar esta valoración?"))) return;
    setActionLoading(true);
    try {
      await deleteValoracion(id);
      navigation.goBack();
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo eliminar."));
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.muted}>Cargando...</Text>
      </View>
    );
  }

  if (!valoracion) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "Valoración no encontrada."}</Text>
      </View>
    );
  }

  const scores = [
    ["General", valoracion.puntuacionGeneral],
    ["Limpieza", valoracion.puntuacionLimpieza],
    ["Confort", valoracion.puntuacionConfort],
    ["Ubicación", valoracion.puntuacionUbicacion],
    ["Instalaciones", valoracion.puntuacionInstalaciones],
    ["Personal", valoracion.puntuacionPersonal],
    ["Calidad/precio", valoracion.puntuacionCalidadPrecio],
  ];

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>Valoración</Text>
        <DetailRow label="Estado" value={valoracion.estadoValoracion} />
        <DetailRow label="Tipo viaje" value={valoracion.tipoViaje} />
        <DetailRow
          label="Portal"
          value={valoracion.publicadaEnPortal ? "Sí" : "No"}
        />
        {scores.map(([label, value]) => (
          <DetailRow key={label} label={label} value={value} />
        ))}
        {valoracion.comentarioPositivo ? (
          <DetailRow label="Comentario +" value={valoracion.comentarioPositivo} />
        ) : null}
        {valoracion.comentarioNegativo ? (
          <DetailRow label="Comentario -" value={valoracion.comentarioNegativo} />
        ) : null}
        {valoracion.respuestaHotel ? (
          <DetailRow label="Respuesta hotel" value={valoracion.respuestaHotel} />
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Moderar</Text>
        <SelectField
          label="Estado"
          value={estadoModeracion}
          options={VALORACION_MODERATION_STATES.map((s) => ({ value: s, label: s }))}
          onChange={setEstadoModeracion}
        />
        <Pressable
          style={[styles.primaryButton, actionLoading && styles.disabled]}
          disabled={actionLoading}
          onPress={handleModerar}
        >
          <Text style={styles.buttonText}>Aplicar moderación</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Responder</Text>
        <TextInput
          style={styles.input}
          value={respuestaHotel}
          onChangeText={setRespuestaHotel}
          placeholder="Respuesta del hotel"
          multiline
        />
        <Pressable
          style={[styles.secondaryButton, actionLoading && styles.disabled]}
          disabled={actionLoading}
          onPress={handleResponder}
        >
          <Text style={styles.buttonText}>Guardar respuesta</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.dangerButton, actionLoading && styles.disabled]}
        disabled={actionLoading}
        onPress={handleDelete}
      >
        <Text style={styles.buttonText}>Eliminar valoración</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 32, gap: 14, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    gap: 10,
    ...shadow,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  rowLabel: { color: colors.muted, fontWeight: "700" },
  rowValue: { flex: 1, color: colors.text, textAlign: "right", fontWeight: "700" },
  muted: { color: colors.muted },
  error: { color: colors.danger, fontWeight: "800", textAlign: "center" },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    backgroundColor: colors.surface,
    textAlignVertical: "top",
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.warning,
  },
  dangerButton: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger,
  },
  buttonText: { color: colors.onPrimary, fontWeight: "800" },
  disabled: { opacity: 0.7 },
});
