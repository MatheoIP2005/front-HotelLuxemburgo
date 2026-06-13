import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import AdminDetailSection from "../../components/admin/AdminDetailSection";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import FormField from "../../components/admin/FormField";
import SelectField from "../../components/admin/SelectField";
import SwitchField from "../../components/admin/SwitchField";
import useRequireAuth from "../../hooks/useRequireAuth";
import { getCatalogo } from "../../services/catalogoServicios.service";
import {
  createTipoHabitacion,
  getTipoHabitacion,
  updateTipoHabitacion,
} from "../../services/tiposHabitacion.service";
import {
  asignarAmenidadTipoHabitacion,
  getTipoHabitacionAmenidades,
  removerAmenidadTipoHabitacion,
} from "../../services/tipoHabitacionAmenidades.service";
import { uploadImage } from "../../services/images.service";
import {
  createTipoHabitacionImagen,
  deleteTipoHabitacionImagen,
  getTipoHabitacionImagenes,
} from "../../services/tipoHabitacionImagenes.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { CATALOGO_TIPOS } from "../../../../src/utils/constraints";
import { normalizeAdminList } from "../../utils/adminCollection";
import { colors } from "../../styles/theme";

const EMPTY_FORM = {
  codigoTipoHabitacion: "",
  nombreTipoHabitacion: "",
  descripcion: "",
  capacidadAdultos: "",
  capacidadNinos: "0",
  tipoCama: "",
  areaM2: "",
  estadoTipoHabitacion: "ACT",
  permiteReservaPublica: true,
  rowVersion: null,
};

const EMPTY_IMAGE = {
  urlImagen: "",
  descripcionImagen: "",
  ordenVisualizacion: "1",
  esPrincipal: false,
};

const validate = (form) => {
  const errors = {};
  if (!form.codigoTipoHabitacion.trim()) errors.codigoTipoHabitacion = "Código obligatorio.";
  if (!form.nombreTipoHabitacion.trim()) errors.nombreTipoHabitacion = "Nombre obligatorio.";
  if (!form.capacidadAdultos || Number(form.capacidadAdultos) <= 0) {
    errors.capacidadAdultos = "Debe ser mayor a 0.";
  }
  if (form.capacidadNinos === "" || Number(form.capacidadNinos) < 0) {
    errors.capacidadNinos = "Debe ser 0 o mayor.";
  }
  if (!form.areaM2 || Number(form.areaM2) <= 0) errors.areaM2 = "Área obligatoria.";
  return errors;
};

export default function AdminTipoHabitacionFormScreen({ navigation, route }) {
  const id = route.params?.id;
  const isEdit = Boolean(id);
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imagenes, setImagenes] = useState([]);
  const [imagenForm, setImagenForm] = useState(EMPTY_IMAGE);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [amenidades, setAmenidades] = useState([]);
  const [catalogoAmenidades, setCatalogoAmenidades] = useState([]);
  const [selectedAmenidadGuid, setSelectedAmenidadGuid] = useState("");

  useEffect(() => {
    if (bootstrapping || !isAuthenticated) return;
    const loadCatalogo = async () => {
      try {
        const response = await getCatalogo({ tipo_catalogo: "AME", pagina: 1, limite: 200 });
        setCatalogoAmenidades(normalizeAdminList(response).items);
      } catch {
        setCatalogoAmenidades([]);
      }
    };
    loadCatalogo();
  }, [bootstrapping, isAuthenticated]);

  useEffect(() => {
    if (bootstrapping || !isAuthenticated || !isEdit) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getTipoHabitacion(id);
        setForm({
          codigoTipoHabitacion: data.codigoTipoHabitacion ?? "",
          nombreTipoHabitacion: data.nombreTipoHabitacion ?? "",
          descripcion: data.descripcion ?? "",
          capacidadAdultos: String(data.capacidadAdultos ?? ""),
          capacidadNinos: String(data.capacidadNinos ?? 0),
          tipoCama: data.tipoCama ?? "",
          areaM2: String(data.areaM2 ?? ""),
          estadoTipoHabitacion: data.estadoTipoHabitacion ?? "ACT",
          permiteReservaPublica: data.permiteReservaPublica ?? true,
          rowVersion: data.rowVersion ?? null,
        });
        const [imgs, ams] = await Promise.all([
          getTipoHabitacionImagenes(id),
          getTipoHabitacionAmenidades(id),
        ]);
        setImagenes(Array.isArray(imgs) ? imgs : imgs?.items ?? []);
        setAmenidades(Array.isArray(ams) ? ams : ams?.items ?? []);
      } catch (err) {
        setError(extractApiErrorMessage(err, "No se pudo cargar el tipo."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bootstrapping, isAuthenticated, id, isEdit]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async () => {
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        capacidadAdultos: Number(form.capacidadAdultos),
        capacidadNinos: Number(form.capacidadNinos),
        areaM2: Number(form.areaM2),
      };
      if (isEdit) {
        await updateTipoHabitacion(id, payload);
        Alert.alert("Guardado", "Tipo actualizado.");
      } else {
        await createTipoHabitacion(payload);
        Alert.alert("Guardado", "Tipo creado.");
      }
      navigation.goBack();
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo guardar."));
    } finally {
      setSaving(false);
    }
  };

  const onSelectImage = async () => {
    setError("");
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError("Se necesita permiso de galería para seleccionar imágenes.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        quality: 0.9,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset) {
        return;
      }

      setUploadingImage(true);
      const uploadResult = await uploadImage(asset);
      const nextUrl =
        uploadResult?.secureUrl ?? uploadResult?.url ?? uploadResult?.urlImagen ?? "";
      setImagenForm((prev) => ({ ...prev, urlImagen: nextUrl }));
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo subir la imagen."));
    } finally {
      setUploadingImage(false);
    }
  };

  const onAddImagen = async () => {
    if (!isEdit) return;
    try {
      await createTipoHabitacionImagen(id, {
        urlImagen: imagenForm.urlImagen,
        descripcionImagen: imagenForm.descripcionImagen,
        ordenVisualizacion: Number(imagenForm.ordenVisualizacion) || 1,
        esPrincipal: imagenForm.esPrincipal,
      });
      const imgs = await getTipoHabitacionImagenes(id);
      setImagenes(Array.isArray(imgs) ? imgs : imgs?.items ?? []);
      setImagenForm(EMPTY_IMAGE);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo agregar imagen."));
    }
  };

  const onAssignAmenidad = async () => {
    if (!selectedAmenidadGuid) return;
    try {
      await asignarAmenidadTipoHabitacion(id, selectedAmenidadGuid);
      const ams = await getTipoHabitacionAmenidades(id);
      setAmenidades(Array.isArray(ams) ? ams : ams?.items ?? []);
      setSelectedAmenidadGuid("");
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo asignar amenidad."));
    }
  };

  const amenidadOptions = catalogoAmenidades
    .filter((c) => CATALOGO_TIPOS.includes(c.tipoCatalogo ?? "AME"))
    .map((c) => ({
      value: c.catalogoGuid,
      label: c.nombreCatalogo || c.codigoCatalogo,
    }));

  if (loading) {
    return (
      <AdminFormScreen
        title={isEdit ? "Editar tipo" : "Nuevo tipo"}
        loading
        onCancel={() => navigation.goBack()}
      />
    );
  }

  return (
    <AdminFormScreen
      title={isEdit ? "Editar tipo habitación" : "Nuevo tipo habitación"}
      submitLabel={isEdit ? "Actualizar" : "Crear"}
      onSubmit={onSubmit}
      onCancel={() => navigation.goBack()}
      saving={saving}
      error={error}
    >
      <FormField label="Código" value={form.codigoTipoHabitacion} onChangeText={(v) => setField("codigoTipoHabitacion", v)} error={fieldErrors.codigoTipoHabitacion} />
      <FormField label="Nombre" value={form.nombreTipoHabitacion} onChangeText={(v) => setField("nombreTipoHabitacion", v)} error={fieldErrors.nombreTipoHabitacion} />
      <FormField label="Descripción" value={form.descripcion} onChangeText={(v) => setField("descripcion", v)} multiline />
      <FormField label="Capacidad adultos" value={form.capacidadAdultos} onChangeText={(v) => setField("capacidadAdultos", v)} keyboardType="numeric" error={fieldErrors.capacidadAdultos} />
      <FormField label="Capacidad niños" value={form.capacidadNinos} onChangeText={(v) => setField("capacidadNinos", v)} keyboardType="numeric" error={fieldErrors.capacidadNinos} />
      <FormField label="Tipo cama" value={form.tipoCama} onChangeText={(v) => setField("tipoCama", v)} />
      <FormField label="Área m²" value={form.areaM2} onChangeText={(v) => setField("areaM2", v)} keyboardType="numeric" error={fieldErrors.areaM2} />
      <SwitchField label="Reserva pública" value={form.permiteReservaPublica} onValueChange={(v) => setField("permiteReservaPublica", v)} />
      {isEdit ? (
        <SelectField
          label="Estado"
          value={form.estadoTipoHabitacion}
          options={[
            { value: "ACT", label: "Activo" },
            { value: "INA", label: "Inactivo" },
          ]}
          onChange={(v) => setField("estadoTipoHabitacion", v)}
        />
      ) : null}

      {isEdit ? (
        <AdminDetailSection title="Imágenes">
          {imagenes.map((img) => (
            <View key={String(img.id ?? img.urlImagen)} style={styles.row}>
              <Text style={styles.small} numberOfLines={2}>{img.urlImagen}</Text>
              <Text
                style={styles.deleteLink}
                onPress={() =>
                  deleteTipoHabitacionImagen(id, img.id ?? img.idTipoHabitacionImagen).then(
                    () => getTipoHabitacionImagenes(id).then((r) =>
                      setImagenes(Array.isArray(r) ? r : r?.items ?? [])
                    )
                  )
                }
              >
                Eliminar
              </Text>
            </View>
          ))}
          <Pressable
            style={[styles.selectImageBtn, uploadingImage && styles.disabledBtn]}
            onPress={onSelectImage}
            disabled={uploadingImage}
          >
            <Text style={styles.selectImageText}>
              {uploadingImage ? "Subiendo imagen..." : "Seleccionar imagen"}
            </Text>
          </Pressable>
          <FormField label="URL" value={imagenForm.urlImagen} onChangeText={(v) => setImagenForm((p) => ({ ...p, urlImagen: v }))} />
          <Text
            style={[styles.addLink, uploadingImage && styles.disabledLink]}
            onPress={uploadingImage ? undefined : onAddImagen}
          >
            Agregar imagen
          </Text>
        </AdminDetailSection>
      ) : null}

      {isEdit ? (
        <AdminDetailSection title="Amenidades">
          {amenidades.map((a) => (
            <View key={String(a.id ?? a.catalogoGuid)} style={styles.row}>
              <Text style={styles.small}>{a.nombreCatalogo ?? a.catalogoGuid}</Text>
              <Text
                style={styles.deleteLink}
                onPress={() =>
                  removerAmenidadTipoHabitacion(id, a.id).then(() =>
                    getTipoHabitacionAmenidades(id).then((r) =>
                      setAmenidades(Array.isArray(r) ? r : r?.items ?? [])
                    )
                  )
                }
              >
                Quitar
              </Text>
            </View>
          ))}
          <SelectField
            label="Asignar amenidad"
            value={selectedAmenidadGuid}
            options={[{ value: "", label: "Seleccionar" }, ...amenidadOptions]}
            onChange={setSelectedAmenidadGuid}
          />
          <Text style={styles.addLink} onPress={onAssignAmenidad}>Asignar</Text>
        </AdminDetailSection>
      ) : null}
    </AdminFormScreen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.muted },
  error: { color: colors.danger, fontWeight: "700" },
  row: { marginBottom: 8, gap: 4 },
  small: { color: colors.text, fontSize: 12 },
  deleteLink: { color: colors.danger, fontWeight: "700" },
  selectImageBtn: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginBottom: 8,
  },
  selectImageText: { color: "#fff", fontWeight: "800" },
  disabledBtn: { opacity: 0.6 },
  addLink: { color: colors.primary, fontWeight: "800" },
  disabledLink: { opacity: 0.6 },
});
