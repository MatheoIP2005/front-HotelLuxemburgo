# Prompts finales para Cursor - Paridad web/mobile

Fecha: 2026-06-13

Estos prompts se ejecutan despues de que Cursor ya completo los prompts de
React Native y paridad admin. No reiniciar el proyecto ni reescribir la app
mobile desde cero. El objetivo es cerrar los faltantes detectados en la
auditoria final:

- web tiene paginas de seguridad creadas, pero sus rutas estan redirigidas;
- mobile no tiene subida nativa de imagenes, solo URL publica;
- queda un placeholder mobile sin uso;
- hay textos con encoding roto;
- falta smoke final de paridad contra Gateway.

Ejecutar en orden. No pasar al siguiente prompt si hay errores.

## Validaciones obligatorias

Desde la raiz `hotel-luxemburgo`:

```powershell
npm run build
npm run lint
```

Desde `HotelLuxemburgo`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Test-Backend.ps1 -NoRestore
```

Desde `hotel-luxemburgo/mobile`:

```powershell
npx expo export --platform ios --clear
```

Si el export falla por permisos de `hermesc.exe`, repetirlo desde una terminal
normal de Windows/Cursor, no interpretar ese error como bug de JavaScript.

---

## Prompt 20 - Habilitar paridad web de seguridad

Contexto:

La app mobile ya incluye Usuarios, Roles, Cambiar password y Auditoria. En web
las paginas existen, pero `src/router/AppRouter.jsx` redirige estas rutas al
dashboard. Para que web y mobile tengan la misma cobertura funcional, habilita
esas rutas y agrega sus entradas al menu admin.

Archivos a revisar antes de modificar:

- `src/router/AppRouter.jsx`
- `src/components/admin/layout/AdminLayout.jsx`
- `src/pages/admin/usuarios/UsuariosPage.jsx`
- `src/pages/admin/usuarios/UsuarioFormPage.jsx`
- `src/pages/admin/roles/RolesPage.jsx`
- `src/pages/admin/roles/RolFormPage.jsx`
- `src/pages/admin/account/CambiarPasswordPage.jsx`
- `src/pages/admin/auditoria/AuditoriaPage.jsx`
- `src/services/usuarios.service.js`
- `src/services/roles.service.js`
- `src/services/permisos.service.js`
- `src/services/auth.service.js`
- `src/services/auditoria.service.js`

Cambios requeridos:

1. En `AppRouter.jsx`, importar:

```js
import UsuariosPage from "../pages/admin/usuarios/UsuariosPage";
import UsuarioFormPage from "../pages/admin/usuarios/UsuarioFormPage";
import RolesPage from "../pages/admin/roles/RolesPage";
import RolFormPage from "../pages/admin/roles/RolFormPage";
import CambiarPasswordPage from "../pages/admin/account/CambiarPasswordPage";
import AuditoriaPage from "../pages/admin/auditoria/AuditoriaPage";
```

2. Reemplazar las rutas que hoy hacen `<Navigate to="/admin" replace />` por:

```jsx
<Route path="usuarios" element={<UsuariosPage />} />
<Route path="usuarios/nuevo" element={<UsuarioFormPage />} />
<Route path="usuarios/:id" element={<UsuarioFormPage />} />
<Route path="roles" element={<RolesPage />} />
<Route path="roles/nuevo" element={<RolFormPage />} />
<Route path="roles/:id" element={<RolFormPage />} />
<Route path="cambiar-password" element={<CambiarPasswordPage />} />
<Route path="auditoria" element={<AuditoriaPage />} />
```

3. En `AdminLayout.jsx`, agregar titulos:

```js
"/admin/usuarios": "Usuarios",
"/admin/roles": "Roles",
"/admin/cambiar-password": "Cambiar password",
"/admin/auditoria": "Auditoria",
```

4. En el menu lateral de `AdminLayout.jsx`, agregar entradas para:

- Usuarios -> `/admin/usuarios`
- Roles -> `/admin/roles`
- Cambiar password -> `/admin/cambiar-password`
- Auditoria -> `/admin/auditoria`

5. No eliminar ningun modulo existente del menu.

6. Verificar que las paginas nuevas se puedan navegar desde el menu y que los
botones internos de usuarios/roles funcionen con las rutas anteriores.

Validacion obligatoria:

```powershell
npm run build
npm run lint
```

Criterios de aceptacion:

- `/admin/usuarios` ya no redirige al dashboard.
- `/admin/roles` ya no redirige al dashboard.
- `/admin/cambiar-password` ya no redirige al dashboard.
- `/admin/auditoria` ya no redirige al dashboard.
- El menu web muestra los mismos modulos administrativos que mobile.
- Build OK.
- Lint sin errores nuevos.

Reporte final:

```text
Rutas habilitadas:
Menu actualizado:
Build:
Lint:
Pendientes:
```

---

## Prompt 21 - Subida nativa de imagenes en mobile

Contexto:

Web permite subir imagenes desde archivo en sucursales y tipos de habitacion
usando `src/services/images.service.js`. Mobile actualmente solo permite
agregar URL publica y muestra mensajes de pendiente:

- `mobile/src/screens/admin/AdminSucursalFormScreen.js`
- `mobile/src/screens/admin/AdminTipoHabitacionFormScreen.js`
- `mobile/src/services/sucursalImagenes.service.js`
- `mobile/src/services/tipoHabitacionImagenes.service.js`

Para paridad funcional, mobile debe permitir seleccionar imagen desde galeria
del telefono y subirla igual que web.

Archivos a revisar antes de modificar:

- `src/services/images.service.js`
- `mobile/package.json`
- `mobile/app.json` o configuracion Expo existente
- `mobile/src/api/internalApi.js`
- `mobile/src/screens/admin/AdminSucursalFormScreen.js`
- `mobile/src/screens/admin/AdminTipoHabitacionFormScreen.js`
- `mobile/src/services/sucursalImagenes.service.js`
- `mobile/src/services/tipoHabitacionImagenes.service.js`

Cambios requeridos:

1. Instalar dependencia compatible con Expo SDK 54:

```powershell
npx expo install expo-image-picker
```

2. Crear servicio mobile:

```text
mobile/src/services/images.service.js
```

3. El servicio debe exponer:

```js
export const uploadImage = async (asset) => { ... }
```

4. Debe soportar el flujo interno `/images/upload` con `FormData` en React
Native:

- tomar `asset.uri`;
- calcular `name` desde `asset.fileName` o un fallback `hotel-image.jpg`;
- calcular `type` desde `asset.mimeType` o fallback `image/jpeg`;
- hacer `internalApi.post("/images/upload", formData, { headers })`;
- devolver una estructura compatible con web: `url`, `secureUrl`, `urlImagen`
  o el payload real del backend.

5. Si existen variables Cloudinary equivalentes para Expo, soportarlas solo si
ya estan documentadas/configuradas. Si no, usar primero el endpoint interno del
Gateway para evitar depender de red externa.

6. En `AdminSucursalFormScreen.js`, agregar boton nativo:

```text
Seleccionar imagen
```

Debe:

- pedir permiso de galeria;
- abrir galeria con `ImagePicker.launchImageLibraryAsync`;
- permitir solo imagenes;
- subir la imagen con `uploadImage`;
- colocar la URL resultante en `imagenForm.urlImagen`;
- mostrar estado `uploadingImage`;
- permitir luego usar el boton existente de agregar imagen.

7. En `AdminTipoHabitacionFormScreen.js`, repetir el mismo flujo.

8. Mantener el campo manual de URL publica. La paridad correcta es permitir
ambos: subir archivo o pegar URL.

9. Quitar textos de "Carga nativa pendiente" cuando la carga ya funcione.

10. Manejar errores:

- permiso denegado;
- usuario cancela seleccion;
- subida falla;
- backend devuelve error.

11. No romper Expo Go. No usar librerias que requieran dev client.

Validacion obligatoria:

```powershell
npm run build
npm run lint
cd mobile
npx expo export --platform ios --clear
```

Criterios de aceptacion:

- Mobile permite seleccionar imagen desde galeria en sucursales.
- Mobile permite seleccionar imagen desde galeria en tipos de habitacion.
- El campo URL se llena con la URL devuelta por backend.
- El flujo manual por URL sigue funcionando.
- No quedan mensajes de "Carga nativa pendiente".
- Expo export iOS OK.
- Web build/lint OK.

Reporte final:

```text
Dependencia instalada:
Servicio mobile creado:
Sucursal imagen:
Tipo habitacion imagen:
Expo export:
Build:
Lint:
Pendientes:
```

---

## Prompt 22 - Limpieza de placeholders y textos

Contexto:

La navegacion mobile ya registra pantallas reales para todos los modulos, pero
queda un componente placeholder sin uso. Tambien hay textos con encoding roto
en web/mobile, por ejemplo `HabitaciÃ³n`, `CatÃ¡logo`, `EstadÃ­a`,
`ContraseÃ±a`.

Archivos a revisar:

- `mobile/src/screens/AdminModulePlaceholderScreen.js`
- `mobile/App.js`
- `mobile/src/navigation/adminRoutes.js`
- `mobile/src/config/adminModules.js`
- `src/components/admin/layout/AdminLayout.jsx`
- `src/pages/admin/**/*.jsx`
- `mobile/src/**/*.js`

Cambios requeridos:

1. Confirmar con busqueda que `AdminModulePlaceholderScreen` no se importa ni
se usa:

```powershell
rg "AdminModulePlaceholder" mobile/src -n
```

2. Si no se usa, eliminar `mobile/src/screens/AdminModulePlaceholderScreen.js`.

3. Buscar textos rotos:

```powershell
rg "Ã|Â|ð|ï|â" src mobile/src -n
```

4. Corregir solo textos visibles de UI. No tocar datos, endpoints, nombres de
variables ni contratos del backend.

Ejemplos:

- `HabitaciÃ³n` -> `Habitación`
- `CatÃ¡logo` -> `Catálogo`
- `EstadÃ­a` -> `Estadía`
- `ContraseÃ±a` -> `Contraseña`
- `Â¿` -> `¿`
- `SÃ­` -> `Sí`

5. En el menu web, si hay iconos corruptos por encoding, reemplazarlos por
texto simple o caracteres seguros. No introducir una libreria nueva solo por
iconos.

6. Verificar que mobile no tenga pantallas placeholder ni textos que indiquen
modulo pendiente.

Validacion obligatoria:

```powershell
npm run build
npm run lint
cd mobile
npx expo export --platform ios --clear
```

Criterios de aceptacion:

- No existe `AdminModulePlaceholderScreen.js` si estaba sin uso.
- `rg "AdminModulePlaceholder" mobile/src -n` no devuelve usos.
- No hay textos visibles con mojibake evidente.
- Build OK.
- Lint sin errores nuevos.
- Expo export OK.

Reporte final:

```text
Placeholder:
Textos corregidos:
Build:
Lint:
Expo export:
Pendientes:
```

---

## Prompt 23 - Smoke final de paridad funcional

Contexto:

Ya no basta con compilar. Hay que demostrar que mobile cubre lo mismo que web:
publico, administrador, usuarios/roles y acciones especiales. RabbitMQ,
GraphQL y bus de eventos siguen siendo responsabilidad del backend/Gateway;
mobile no debe conectarse directo a RabbitMQ ni gRPC.

Archivos a revisar:

- `docs/mobile_admin_parity_matrix.md`
- `docs/mobile_admin_parity_audit.md`
- `mobile/src/config/adminModules.js`
- `mobile/src/navigation/adminRoutes.js`
- `src/router/AppRouter.jsx`
- `src/components/admin/layout/AdminLayout.jsx`

Cambios requeridos:

1. Actualizar o crear una matriz final en:

```text
docs/mobile_admin_parity_matrix.md
```

Formato:

```text
Modulo | Web ruta/menu | Mobile pantalla/menu | Acciones cubiertas | Estado
```

2. Incluir todos estos modulos:

- Buscar alojamiento
- Detalle alojamiento
- Reserva publica
- Pago simulado
- Confirmacion
- Dashboard admin
- Sucursales
- Tipos habitacion
- Habitaciones
- Tarifas
- Catalogo servicios
- Clientes
- Reservas
- Estadias
- Facturas
- Pagos
- Valoraciones
- Usuarios
- Roles
- Cambiar password
- Auditoria

3. Verificar que cada modulo mobile esta en `mobile/src/config/adminModules.js`
o en el stack publico de `mobile/App.js`.

4. Verificar que cada modulo web esta en `src/router/AppRouter.jsx` y, si es
admin, en el menu de `AdminLayout.jsx`.

5. Ejecutar validaciones:

```powershell
npm run build
npm run lint
cd mobile
npx expo export --platform ios --clear
```

Desde backend:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Test-Backend.ps1 -NoRestore
```

6. Si el Gateway esta levantado, probar manualmente desde web o mobile:

- login admin;
- listar cada modulo admin;
- crear/editar un registro de bajo riesgo si hay datos de prueba;
- subir imagen desde mobile en sucursal o tipo habitacion;
- crear reserva publica;
- confirmar/cancelar reserva admin;
- check-in/check-out si existen datos validos;
- generar/anular factura si existen datos validos;
- crear/aprobar pago;
- asignar/remover rol;
- asignar/remover permiso;
- consultar auditoria.

7. Si RabbitMQ esta disponible, verificar indirectamente:

- ejecutar una accion admin que genere auditoria;
- revisar que el backend persista o muestre el evento en auditoria;
- confirmar que mobile no tiene dependencias ni conexiones RabbitMQ.

8. Buscar imports web-only en mobile:

```powershell
rg "window|document|localStorage|sessionStorage|react-router-dom|import.meta.env" mobile/src -n
```

Si hay coincidencias, corregir salvo que sea texto/documentacion no ejecutada.

Criterios de aceptacion:

- No hay modulos web sin equivalente mobile.
- No hay modulos mobile rotos o sin pantalla.
- No hay placeholders.
- Subida de imagenes nativa funciona en mobile.
- Web build OK.
- Web lint OK sin errores.
- Expo export iOS OK.
- Backend OK.
- RabbitMQ/GraphQL/event bus no son consumidos directamente por mobile.

Reporte final:

```text
Paridad publica:
Paridad admin:
Usuarios/Roles:
Imagenes mobile:
Auditoria:
Validaciones:
- Web build:
- Web lint:
- Expo iOS export:
- Backend:
- Gateway smoke/manual:
- RabbitMQ indirecto:
Pendientes reales:
```

---

## Prompt 24 - Preparar ejecucion en Expo Go con iPhone

Contexto:

Este prompt no cambia funcionalidades. Solo deja lista la ejecucion real en
Expo Go usando un dispositivo Apple en la misma red que el computador.

Cambios requeridos:

1. Documentar en README o en `docs/expo_go_runbook.md`:

- instalar/actualizar Expo Go en iPhone;
- verificar que Expo Go soporte SDK 54;
- conectar iPhone y PC a la misma red Wi-Fi;
- obtener IP LAN del PC;
- usar `EXPO_PUBLIC_API_BASE_URL` con IP LAN, no `localhost`.

Ejemplo:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://192.168.1.50:5000/api/v1"
npm run mobile:start
```

2. Indicar que desde Safari del iPhone se debe probar:

```text
http://IP_DEL_PC:5000/health
```

o el endpoint de health disponible del Gateway/proyecto.

3. Indicar revisar firewall de Windows si el iPhone no puede acceder al Gateway.

4. No agregar dependencias nativas incompatibles con Expo Go.

Validacion:

```powershell
cd mobile
npx expo export --platform ios --clear
```

Criterios de aceptacion:

- Hay instrucciones claras para correr con Expo Go.
- Se usa IP LAN.
- Se documenta firewall.
- Expo export iOS sigue OK.

Reporte final:

```text
Runbook:
URL API:
Expo export:
Notas iPhone:
```
