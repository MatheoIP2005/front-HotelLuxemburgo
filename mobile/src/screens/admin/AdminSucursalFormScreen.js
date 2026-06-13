import { useEffect, useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import AdminDetailSection from "../../components/admin/AdminDetailSection";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import FormField from "../../components/admin/FormField";
import SelectField from "../../components/admin/SelectField";
import SwitchField from "../../components/admin/SwitchField";
import useRequireAuth from "../../hooks/useRequireAuth";
import {
  createSucursal,
  getSucursal,
  updateSucursal,
} from "../../services/sucursales.service";
import { uploadImage } from "../../services/images.service";
import {
  createSucursalImagen,
  deleteSucursalImagen,
  getSucursalImagenes,
} from "../../services/sucursalImagenes.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import {
  EMAIL_REGEX,
  MAX_LENGTHS,
  SUCURSAL_CATEGORIA_VIAJE_OPTIONS,
  SUCURSAL_TIPO_ALOJAMIENTO_OPTIONS,
  TIME_24H_REGEX,
} from "../../../../src/utils/constraints";
import { colors } from "../../styles/theme";

const EMPTY_FORM = {
  codigoSucursal: "",
  nombreSucursal: "",
  tipoAlojamiento: "hotel",
  estrellas: "",
  categoriaViaje: "",
  descripcionCorta: "",
  descripcionSucursal: "",
  pais: "Ecuador",
  provincia: "",
  ciudad: "",
  direccion: "",
  ubicacion: "",
  telefono: "",
  correo: "",
  horaCheckin: "15:00",
  horaCheckout: "12:00",
  checkinAnticipado: false,
  checkoutTardio: false,
  aceptaNinos: true,
  edadMinimaHuesped: "",
  permiteMascotas: false,
  sePermiteFumar: false,
};

const EMPTY_IMAGE = {
  urlImagen: "",
  descripcionImagen: "",
  ordenVisualizacion: "1",
  esPrincipal: false,
};

const trim = (v) => String(v ?? "").trim();

const validate = (form) => {
  const errors = {};
  if (!trim(form.codigoSucursal)) errors.codigoSucursal = "El código es obligatorio.";
  else if (trim(form.codigoSucursal).length > MAX_LENGTHS.sucursal.codigo) {
    errors.codigoSucursal = "Máximo 10 caracteres.";
  }
  if (!trim(form.nombreSucursal)) errors.nombreSucursal = "El nombre es obligatorio.";
  if (!SUCURSAL_TIPO_ALOJAMIENTO_OPTIONS.includes(form.tipoAlojamiento)) {
    errors.tipoAlojamiento = "Tipo inválido.";
  }
  if (form.estrellas && (Number(form.estrellas) < 1 || Number(form.estrellas) > 5)) {
    errors.estrellas = "Entre 1 y 5.";
  }
  if (!trim(form.pais)) errors.pais = "El país es obligatorio.";
  if (!trim(form.ciudad)) errors.ciudad = "La ciudad es obligatoria.";
  if (!trim(form.direccion)) errors.direccion = "La dirección es obligatoria.";
  if (!trim(form.telefono)) errors.telefono = "El teléfono es obligatorio.";
  if (!trim(form.correo) || !EMAIL_REGEX.test(trim(form.correo))) {
    errors.correo = "Correo inválido.";
  }
  if (form.horaCheckin && !TIME_24H_REGEX.test(form.horaCheckin)) {
    errors.horaCheckin = "Formato HH:MM.";
  }
  if (form.horaCheckout && !TIME_24H_REGEX.test(form.horaCheckout)) {
    errors.horaCheckout = "Formato HH:MM.";
  }
  return errors;
};

export default function AdminSucursalFormScreen({ navigation, route }) {
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

  const tipoOptions = useMemo(
    () => SUCURSAL_TIPO_ALOJAMIENTO_OPTIONS.map((v) => ({ value: v, label: v })),
    []
  );
  const categoriaOptions = useMemo(
    () => [
      { value: "", label: "Ninguna" },
      ...SUCURSAL_CATEGORIA_VIAJE_OPTIONS.map((v) => ({ value: v, label: v })),
    ],
    []
  );

  useEffect(() => {
    if (bootstrapping || !isAuthenticated || !isEdit) return;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getSucursal(id);
        setForm({
          ...EMPTY_FORM,
          codigoSucursal: data.codigoSucursal ?? "",
          nombreSucursal: data.nombreSucursal ?? "",
          tipoAlojamiento: data.tipoAlojamiento ?? "hotel",
          estrellas: data.estrellas != null ? String(data.estrellas) : "",
          categoriaViaje: data.categoriaViaje ?? "",
          descripcionCorta: data.descripcionCorta ?? "",
          descripcionSucursal: data.descripcionSucursal ?? "",
          pais: data.pais ?? "Ecuador",
          provincia: data.provincia ?? "",
          ciudad: data.ciudad ?? "",
          direccion: data.direccion ?? "",
          ubicacion: data.ubicacion ?? "",
          telefono: data.telefono ?? "",
          correo: data.correo ?? "",
          horaCheckin: data.horaCheckin ?? "15:00",
          horaCheckout: data.horaCheckout ?? "12:00",
          checkinAnticipado: Boolean(data.checkinAnticipado),
          checkoutTardio: Boolean(data.checkoutTardio),
          aceptaNinos: data.aceptaNinos ?? true,
          edadMinimaHuesped:
            data.edadMinimaHuesped != null ? String(data.edadMinimaHuesped) : "",
          permiteMascotas: Boolean(data.permiteMascotas),
          sePermiteFumar: Boolean(data.sePermiteFumar),
        });
        const imgs = await getSucursalImagenes(id);
        setImagenes(Array.isArray(imgs) ? imgs : imgs?.items ?? []);
      } catch (err) {
        setError(extractApiErrorMessage(err, "No se pudo cargar la sucursal."));
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
        estrellas: form.estrellas ? Number(form.estrellas) : null,
        edadMinimaHuesped: form.edadMinimaHuesped ? Number(form.edadMinimaHuesped) : null,
      };
      if (isEdit) {
        await updateSucursal(id, payload);
        Alert.alert("Guardado", "Sucursal actualizada.");
      } else {
        await createSucursal(payload);
        Alert.alert("Guardado", "Sucursal creada.");
      }
      navigation.goBack();
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo guardar."));
    } finally {
      setSaving(false);
    }
  };

  const onAddImagen = async () => {
    if (!isEdit) {
      setError("Guarda la sucursal antes de agregar imágenes.");
      return;
    }
    try {
      await createSucursalImagen(id, {
        urlImagen: imagenForm.urlImagen,
        descripcionImagen: imagenForm.descripcionImagen,
        ordenVisualizacion: Number(imagenForm.ordenVisualizacion) || 1,
        esPrincipal: imagenForm.esPrincipal,
      });
      const imgs = await getSucursalImagenes(id);
      setImagenes(Array.isArray(imgs) ? imgs : imgs?.items ?? []);
      setImagenForm(EMPTY_IMAGE);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo agregar la imagen."));
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

  const onDeleteImagen = async (imageId) => {
    try {
      await deleteSucursalImagen(id, imageId);
      setImagenes((prev) =>
        prev.filter((img) => String(img.idSucursalImagen ?? img.id) !== String(imageId))
      );
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo eliminar la imagen."));
    }
  };

  if (loading) {
    return (
      <AdminFormScreen
        title={isEdit ? "Editar sucursal" : "Nueva sucursal"}
        loading
        onCancel={() => navigation.goBack()}
      />
    );
  }

  return (
    <AdminFormScreen
      title={isEdit ? "Editar sucursal" : "Nueva sucursal"}
      subtitle="Políticas incluidas en el formulario (check-in, mascotas, etc.)"
      submitLabel={isEdit ? "Actualizar" : "Crear"}
      onSubmit={onSubmit}
      onCancel={() => navigation.goBack()}
      saving={saving}
      error={error}
    >
      <FormField
        label="Código"
        value={form.codigoSucursal}
        onChangeText={(v) => setField("codigoSucursal", v)}
        error={fieldErrors.codigoSucursal}
      />
      <FormField
        label="Nombre"
        value={form.nombreSucursal}
        onChangeText={(v) => setField("nombreSucursal", v)}
        error={fieldErrors.nombreSucursal}
      />
      <SelectField
        label="Tipo alojamiento"
        value={form.tipoAlojamiento}
        options={tipoOptions}
        onChange={(v) => setField("tipoAlojamiento", v)}
      />
      <FormField
        label="Estrellas (1-5)"
        value={form.estrellas}
        onChangeText={(v) => setField("estrellas", v)}
        keyboardType="numeric"
        error={fieldErrors.estrellas}
      />
      <SelectField
        label="Categoría viaje"
        value={form.categoriaViaje}
        options={categoriaOptions}
        onChange={(v) => setField("categoriaViaje", v)}
      />
      <FormField
        label="Descripción corta"
        value={form.descripcionCorta}
        onChangeText={(v) => setField("descripcionCorta", v)}
        multiline
      />
      <FormField
        label="Descripción"
        value={form.descripcionSucursal}
        onChangeText={(v) => setField("descripcionSucursal", v)}
        multiline
      />
      <FormField label="País" value={form.pais} onChangeText={(v) => setField("pais", v)} error={fieldErrors.pais} />
      <FormField label="Provincia" value={form.provincia} onChangeText={(v) => setField("provincia", v)} />
      <FormField label="Ciudad" value={form.ciudad} onChangeText={(v) => setField("ciudad", v)} error={fieldErrors.ciudad} />
      <FormField label="Dirección" value={form.direccion} onChangeText={(v) => setField("direccion", v)} error={fieldErrors.direccion} />
      <FormField label="Ubicación" value={form.ubicacion} onChangeText={(v) => setField("ubicacion", v)} />
      <FormField label="Teléfono" value={form.telefono} onChangeText={(v) => setField("telefono", v)} keyboardType="phone-pad" error={fieldErrors.telefono} />
      <FormField label="Correo" value={form.correo} onChangeText={(v) => setField("correo", v)} keyboardType="email-address" autoCapitalize="none" error={fieldErrors.correo} />
      <FormField label="Hora check-in" value={form.horaCheckin} onChangeText={(v) => setField("horaCheckin", v)} error={fieldErrors.horaCheckin} />
      <FormField label="Hora check-out" value={form.horaCheckout} onChangeText={(v) => setField("horaCheckout", v)} error={fieldErrors.horaCheckout} />
      <SwitchField label="Check-in anticipado" value={form.checkinAnticipado} onValueChange={(v) => setField("checkinAnticipado", v)} />
      <SwitchField label="Checkout tardío" value={form.checkoutTardio} onValueChange={(v) => setField("checkoutTardio", v)} />
      <SwitchField label="Acepta niños" value={form.aceptaNinos} onValueChange={(v) => setField("aceptaNinos", v)} />
      <SwitchField label="Permite mascotas" value={form.permiteMascotas} onValueChange={(v) => setField("permiteMascotas", v)} />
      <SwitchField label="Se permite fumar" value={form.sePermiteFumar} onValueChange={(v) => setField("sePermiteFumar", v)} />
      <FormField label="Edad mínima huésped" value={form.edadMinimaHuesped} onChangeText={(v) => setField("edadMinimaHuesped", v)} keyboardType="numeric" />

      <AdminDetailSection title="Imágenes">
        {imagenes.map((img) => (
          <View key={String(img.idSucursalImagen ?? img.urlImagen)} style={styles.imageRow}>
            <Text style={styles.imageUrl} numberOfLines={2}>
              {img.urlImagen}
            </Text>
            {isEdit ? (
              <Text
                style={styles.deleteLink}
                onPress={() => onDeleteImagen(img.idSucursalImagen ?? img.id)}
              >
                Eliminar
              </Text>
            ) : null}
          </View>
        ))}
        {isEdit ? (
          <>
            <Pressable
              style={[styles.selectImageBtn, uploadingImage && styles.disabledBtn]}
              onPress={onSelectImage}
              disabled={uploadingImage}
            >
              <Text style={styles.selectImageText}>
                {uploadingImage ? "Subiendo imagen..." : "Seleccionar imagen"}
              </Text>
            </Pressable>
            <FormField
              label="URL imagen"
              value={imagenForm.urlImagen}
              onChangeText={(v) => setImagenForm((p) => ({ ...p, urlImagen: v }))}
            />
            <FormField
              label="Descripción"
              value={imagenForm.descripcionImagen}
              onChangeText={(v) => setImagenForm((p) => ({ ...p, descripcionImagen: v }))}
            />
            <FormField
              label="Orden"
              value={imagenForm.ordenVisualizacion}
              onChangeText={(v) => setImagenForm((p) => ({ ...p, ordenVisualizacion: v }))}
              keyboardType="numeric"
            />
            <SwitchField
              label="Principal"
              value={imagenForm.esPrincipal}
              onValueChange={(v) => setImagenForm((p) => ({ ...p, esPrincipal: v }))}
            />
            <Text
              style={[styles.addImageLink, uploadingImage && styles.disabledLink]}
              onPress={uploadingImage ? undefined : onAddImagen}
            >
              Agregar imagen
            </Text>
          </>
        ) : null}
      </AdminDetailSection>
    </AdminFormScreen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.muted },
  error: { color: colors.danger, fontWeight: "700" },
  imageRow: { gap: 4, marginBottom: 8 },
  imageUrl: { color: colors.text, fontSize: 12 },
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
  addImageLink: { color: colors.primary, fontWeight: "800", marginTop: 8 },
  disabledLink: { opacity: 0.6 },
});
