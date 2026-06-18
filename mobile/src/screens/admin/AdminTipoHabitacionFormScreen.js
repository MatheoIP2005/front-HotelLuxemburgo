import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import AdminDetailSection from "../../components/admin/AdminDetailSection";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import FormField from "../../components/admin/FormField";
import ImagePreview from "../../components/admin/ImagePreview";
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
import { CATALOGO_TIPOS, MAX_LENGTHS } from "../../../../src/utils/constraints";
import { normalizeAdminList, ensureLoadedEntity, filterSafeList, FORM_VALIDATION_BANNER, pickGuid } from "../../utils/adminCollection";
import {
  buildTipoHabitacionPayload,
  getTipoCapacidadTotal,
  validateTipoHabitacionForm,
} from "../../utils/tiposHabitacion";
import {
  sanitizeDecimalInput,
  sanitizeOptionalDigits,
} from "../../utils/numeric";
import { colors } from "../../styles/theme";

const TIPO_LIMITS = {
  codigo: 30,
  nombre: 60,
  tipoCama: 60,
};

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

const trimText = (value) => String(value ?? "").trim();

const buildImagePayload = (imagenForm) => {
  const urlImagen = trimText(imagenForm.urlImagen);
  const descripcionImagen = trimText(imagenForm.descripcionImagen);
  const ordenVisualizacion = Number(imagenForm.ordenVisualizacion || 1);

  if (!urlImagen) {
    throw new Error("La URL de la imagen es obligatoria.");
  }
  if (urlImagen.length > MAX_LENGTHS.imagen.url) {
    throw new Error(`La URL no puede exceder ${MAX_LENGTHS.imagen.url} caracteres.`);
  }
  if (descripcionImagen.length > MAX_LENGTHS.imagen.descripcion) {
    throw new Error(
      `La descripción no puede exceder ${MAX_LENGTHS.imagen.descripcion} caracteres.`
    );
  }
  if (!Number.isFinite(ordenVisualizacion) || ordenVisualizacion <= 0) {
    throw new Error("El orden de visualización debe ser mayor a cero.");
  }

  return {
    urlImagen,
    descripcionImagen: descripcionImagen || null,
    ordenVisualizacion,
    esPrincipal: imagenForm.esPrincipal,
  };
};

const validate = (form) => validateTipoHabitacionForm(form);

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
        if (!ensureLoadedEntity(data, setError, "Tipo de habitación no encontrado.")) return;
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
        setImagenes(filterSafeList(Array.isArray(imgs) ? imgs : imgs?.items ?? []));
        setAmenidades(filterSafeList(Array.isArray(ams) ? ams : ams?.items ?? []));
      } catch (err) {
        setError(extractApiErrorMessage(err, "No se pudo cargar el tipo."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bootstrapping, isAuthenticated, id, isEdit]);

  const setField = (key, value) => {
    const numericSanitizers = {
      capacidadAdultos: sanitizeOptionalDigits,
      capacidadNinos: sanitizeOptionalDigits,
      areaM2: sanitizeDecimalInput,
    };
    const nextValue = numericSanitizers[key] ? numericSanitizers[key](value) : value;
    setForm((prev) => ({ ...prev, [key]: nextValue }));
  };

  const capacidadTotal = getTipoCapacidadTotal(form);

  const onSubmit = async () => {
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError(FORM_VALIDATION_BANNER);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = buildTipoHabitacionPayload(form, isEdit);
      if (isEdit) {
        await updateTipoHabitacion(id, payload);
        Alert.alert("Guardado", "Tipo actualizado.");
      } else {
        const createdTipo = await createTipoHabitacion(payload);
        const createdTipoGuid = pickGuid(
          createdTipo,
          "tipoHabitacionGuid",
          "tipo_habitacion_guid"
        );

        if (imagenes.length > 0 && !createdTipoGuid) {
          throw new Error(
            "El tipo fue creado, pero no se pudo obtener su GUID para registrar las imágenes."
          );
        }

        if (createdTipoGuid && imagenes.length > 0) {
          await Promise.all(
            imagenes.map((imagen) =>
              createTipoHabitacionImagen(createdTipoGuid, {
                urlImagen: imagen.urlImagen,
                descripcionImagen: imagen.descripcionImagen,
                ordenVisualizacion: imagen.ordenVisualizacion,
                esPrincipal: imagen.esPrincipal,
              })
            )
          );
        }

        Alert.alert(
          "Guardado",
          imagenes.length > 0
            ? "Tipo creado con sus imágenes."
            : "Tipo creado."
        );
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
    setError("");
    try {
      const payload = buildImagePayload(imagenForm);

      if (isEdit) {
        await createTipoHabitacionImagen(id, payload);
        const imgs = await getTipoHabitacionImagenes(id);
        setImagenes(filterSafeList(Array.isArray(imgs) ? imgs : imgs?.items ?? []));
      } else {
        const stagedImage = {
          ...payload,
          tempId: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        };
        setImagenes((prev) => [
          ...prev.map((imagen) =>
            stagedImage.esPrincipal ? { ...imagen, esPrincipal: false } : imagen
          ),
          stagedImage,
        ]);
      }

      setImagenForm(EMPTY_IMAGE);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo agregar imagen."));
    }
  };

  const onDeleteImagen = async (imageId) => {
    if (!isEdit) {
      setImagenes((prev) => prev.filter((img) => img.tempId !== imageId));
      return;
    }
    try {
      await deleteTipoHabitacionImagen(id, imageId);
      const imgs = await getTipoHabitacionImagenes(id);
      setImagenes(filterSafeList(Array.isArray(imgs) ? imgs : imgs?.items ?? []));
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo eliminar la imagen."));
    }
  };

  const onAssignAmenidad = async () => {
    if (!selectedAmenidadGuid) {
      setError("Selecciona una amenidad para asignar.");
      return;
    }
    setError("");
    try {
      await asignarAmenidadTipoHabitacion(id, selectedAmenidadGuid);
      const ams = await getTipoHabitacionAmenidades(id);
      setAmenidades(filterSafeList(Array.isArray(ams) ? ams : ams?.items ?? []));
      setSelectedAmenidadGuid("");
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo asignar amenidad."));
    }
  };

  const onRemoveAmenidad = async (amenidadId) => {
    setError("");
    try {
      await removerAmenidadTipoHabitacion(id, amenidadId);
      const ams = await getTipoHabitacionAmenidades(id);
      setAmenidades(filterSafeList(Array.isArray(ams) ? ams : ams?.items ?? []));
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo quitar la amenidad."));
    }
  };

  const amenidadOptions = catalogoAmenidades
    .filter((c) => c && CATALOGO_TIPOS.includes(c.tipoCatalogo ?? "AME"))
    .map((c) => ({
      value: c.catalogoGuid ?? "",
      label: c.nombreCatalogo || c.codigoCatalogo || "Sin nombre",
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
      <AdminDetailSection title="Información">
      <FormField label="Código" value={form.codigoTipoHabitacion} onChangeText={(v) => setField("codigoTipoHabitacion", v)} maxLength={TIPO_LIMITS.codigo} error={fieldErrors.codigoTipoHabitacion} />
      <FormField label="Nombre" value={form.nombreTipoHabitacion} onChangeText={(v) => setField("nombreTipoHabitacion", v)} maxLength={TIPO_LIMITS.nombre} error={fieldErrors.nombreTipoHabitacion} />
      <FormField label="Descripción" value={form.descripcion} onChangeText={(v) => setField("descripcion", v)} multiline />
      <FormField label="Capacidad adultos" value={form.capacidadAdultos} onChangeText={(v) => setField("capacidadAdultos", v)} keyboardType="numeric" error={fieldErrors.capacidadAdultos} />
      <FormField label="Capacidad niños" value={form.capacidadNinos} onChangeText={(v) => setField("capacidadNinos", v)} keyboardType="numeric" error={fieldErrors.capacidadNinos} />
      <FormField
        label="Capacidad total"
        value={String(capacidadTotal)}
        editable={false}
        error={fieldErrors.capacidadTotal}
      />
      <FormField label="Tipo cama" value={form.tipoCama} onChangeText={(v) => setField("tipoCama", v)} maxLength={TIPO_LIMITS.tipoCama} error={fieldErrors.tipoCama} />
      <FormField label="Área m²" value={form.areaM2} onChangeText={(v) => setField("areaM2", v)} keyboardType="numeric" error={fieldErrors.areaM2} />
      </AdminDetailSection>

      <AdminDetailSection title="Configuración">
      <SwitchField label="Reserva pública" value={form.permiteReservaPublica} onValueChange={(v) => setField("permiteReservaPublica", v)} />
      <SelectField
        label="Estado"
        value={form.estadoTipoHabitacion}
        options={[
          { value: "ACT", label: "Activo" },
          { value: "INA", label: "Inactivo" },
        ]}
        onChange={(v) => setField("estadoTipoHabitacion", v)}
      />
      </AdminDetailSection>

      <AdminDetailSection title="Imágenes">
        {imagenes.length === 0 ? (
          <Text style={styles.muted}>
            {isEdit
              ? "No hay imágenes registradas."
              : "No hay imágenes preparadas. Puedes agregarlas antes de crear el tipo."}
          </Text>
        ) : null}
        {imagenes.map((img, index) =>
          img ? (
          <View
            key={String(img.id ?? img.idTipoHabitacionImagen ?? img.tempId ?? img.urlImagen ?? index)}
            style={styles.imageRow}
          >
            <ImagePreview uri={img.urlImagen} size={72} />
            <View style={styles.imageMeta}>
              <Text style={styles.small} numberOfLines={2}>{img.urlImagen ?? "-"}</Text>
              <Text
                style={styles.deleteLink}
                onPress={() =>
                  onDeleteImagen(
                    isEdit ? img.id ?? img.idTipoHabitacionImagen : img.tempId
                  )
                }
              >
                Eliminar
              </Text>
            </View>
          </View>
          ) : null
        )}
        <Pressable
          style={[styles.selectImageBtn, uploadingImage && styles.disabledBtn]}
          onPress={onSelectImage}
          disabled={uploadingImage}
        >
          <Text style={styles.selectImageText}>
            {uploadingImage ? "Subiendo imagen..." : "Seleccionar imagen"}
          </Text>
        </Pressable>
        <Text style={styles.muted}>
          {isEdit
            ? "Se sube a Cloudinary si el backend tiene configuradas las variables."
            : "Puedes preparar imágenes; se guardarán al crear el tipo."}
        </Text>
        <FormField
          label="URL imagen"
          value={imagenForm.urlImagen}
          onChangeText={(v) => setImagenForm((p) => ({ ...p, urlImagen: v }))}
          autoCapitalize="none"
          maxLength={MAX_LENGTHS.imagen.url}
        />
        {imagenForm.urlImagen ? <ImagePreview uri={imagenForm.urlImagen} size={120} /> : null}
        <FormField
          label="Descripción"
          value={imagenForm.descripcionImagen}
          onChangeText={(v) => setImagenForm((p) => ({ ...p, descripcionImagen: v }))}
          maxLength={MAX_LENGTHS.imagen.descripcion}
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
        <Pressable
          style={[styles.addImageBtn, uploadingImage && styles.disabledBtn]}
          onPress={onAddImagen}
          disabled={uploadingImage}
        >
          <Text style={styles.addImageText}>Agregar imagen</Text>
        </Pressable>
      </AdminDetailSection>

      {isEdit ? (
        <AdminDetailSection title="Amenidades">
          {amenidades.map((a, index) =>
            a ? (
            <View key={String(a.id ?? a.catalogoGuid ?? index)} style={styles.row}>
              <Text style={styles.small}>{a.nombreCatalogo ?? a.catalogoGuid ?? "-"}</Text>
              <Pressable onPress={() => onRemoveAmenidad(a.id)}>
                <Text style={styles.deleteLink}>Quitar</Text>
              </Pressable>
            </View>
            ) : null
          )}
          <SelectField
            label="Asignar amenidad"
            value={selectedAmenidadGuid}
            options={[{ value: "", label: "Seleccionar" }, ...amenidadOptions]}
            onChange={setSelectedAmenidadGuid}
          />
          <Pressable
            style={styles.addImageBtn}
            onPress={onAssignAmenidad}
          >
            <Text style={styles.addImageText}>Asignar amenidad</Text>
          </Pressable>
        </AdminDetailSection>
      ) : null}
    </AdminFormScreen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.muted },
  error: { color: colors.danger, fontWeight: "700" },
  row: { marginBottom: 8, gap: 4 },
  imageRow: { flexDirection: "row", gap: 12, marginBottom: 12, alignItems: "flex-start" },
  imageMeta: { flex: 1, gap: 4 },
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
  selectImageText: { color: colors.onPrimary, fontWeight: "800" },
  disabledBtn: { opacity: 0.6 },
  addImageBtn: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: 8,
  },
  addImageText: { color: colors.primary, fontWeight: "800" },
});
