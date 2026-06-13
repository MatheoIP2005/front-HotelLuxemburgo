# Prompts para Cursor - Paridad total mobile con web

Estos prompts reemplazan el alcance anterior de "admin limitado". Cursor ya
ejuto hasta el Prompt 9 de `cursor_prompts_react_native.md`, pero el alcance
correcto ahora es:

```text
La app React Native debe tener las mismas funcionalidades que el frontend web,
incluyendo administrador y usuarios.
```

No reiniciar desde cero. Continuar desde el estado actual.

## Contexto obligatorio

Leer antes de modificar:

- `docs/mobile_admin_parity_audit.md`
- `mobile/App.js`
- `src/router/AppRouter.jsx`
- `src/services/*.service.js`
- `mobile/src/services/*.service.js`
- `mobile/src/context/AuthContext.js`
- `mobile/src/api/internalApi.js`

Reglas:

- No conectar mobile a RabbitMQ.
- No conectar mobile a gRPC.
- Usar Gateway REST bajo `EXPO_PUBLIC_API_BASE_URL`.
- Endpoints internos usan JWT por `internalApi`.
- Mantener web funcionando.
- No borrar booking publico mobile.
- No borrar admin reservas actual; ampliarlo.
- No crear pantallas de marketing.
- Compilar/probar despues de cada prompt.

Comandos obligatorios despues de cada prompt:

```powershell
npm run build
npm run lint
powershell -ExecutionPolicy Bypass -File ..\HotelLuxemburgo\scripts\Test-Backend.ps1 -NoRestore
```

Si se toca mobile, validar Metro:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://127.0.0.1:5000/api/v1"
npm run mobile:start
```

Si algun comando falla, detenerse, corregir y repetir. No seguir al siguiente
prompt con errores abiertos.

---

## Prompt 10 - Infraestructura mobile admin reutilizable

Objetivo:

Crear componentes y patrones reutilizables para CRUD mobile, antes de duplicar
logica en cada modulo.

Cambios:

1. Crear carpeta:

```text
mobile/src/components/admin
```

2. Crear componentes reutilizables:

```text
AdminMenuScreen.js o AdminModuleGrid.js
AdminListScreen.js
AdminFormScreen.js
AdminDetailSection.js
AdminActionBar.js
FormField.js
SelectField.js
EmptyState.js
ErrorState.js
LoadingState.js
```

3. Actualizar `AdminHomeScreen` para mostrar accesos a todos los modulos:

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

4. Registrar rutas placeholder en `mobile/App.js` solo si ya existe pantalla
real o pantalla temporal clara que diga "modulo pendiente". No dejar botones
que naveguen a rutas inexistentes.

5. No implementar logica de negocio todavia, salvo navegacion.

Criterios de aceptacion:

- AdminHome muestra todos los modulos requeridos.
- No hay rutas rotas.
- Web build/lint OK.
- Backend OK.
- Expo/Metro arranca.

Reporte final:

```text
Componentes creados:
Rutas admin agregadas:
Modulos visibles:
Build:
Lint:
Backend:
Metro:
Pendientes:
```

---

## Prompt 11 - Servicios mobile/shared para todos los modulos

Objetivo:

Crear equivalentes mobile para todos los servicios web que faltan, usando
`internalApi`, `authApi` o `publicApi` segun corresponda.

Servicios a crear en `mobile/src/services` o factories compartidas en
`src/shared/services` si conviene:

- `sucursales.service.js`
- `sucursalImagenes.service.js`
- `tiposHabitacion.service.js`
- `tipoHabitacionImagenes.service.js`
- `tipoHabitacionAmenidades.service.js`
- `habitaciones.service.js`
- `tarifas.service.js`
- `catalogoServicios.service.js`
- `clientes.service.js`
- `estadias.service.js`
- `cargosEstadia.service.js`
- `facturas.service.js`
- `pagos.service.js`
- `valoraciones.service.js`
- `usuarios.service.js`
- `roles.service.js`
- `permisos.service.js`
- `auditoria.service.js`

Reglas:

- Copiar contratos de `src/services`, no inventar rutas.
- Mantener nombres de funciones equivalentes cuando sea posible.
- Usar `extractApiPayload`.
- No usar `localStorage`, `window`, `document`, `FormData` web salvo que React
  Native lo soporte en el caso concreto.
- Para imagenes, documentar limitacion si no se implementa selector/carga nativa.

Criterios de aceptacion:

- Todos los servicios compilan.
- No hay imports web-only en `mobile/src`.
- Lint sin errores.

Reporte final:

```text
Servicios creados:
Endpoints cubiertos:
Limitaciones:
Build:
Lint:
Backend:
Metro:
```

---

## Prompt 12 - Accommodation admin mobile

Objetivo:

Implementar paridad mobile de los modulos web de Accommodation:

- Sucursales
- Tipos habitacion
- Habitaciones
- Tarifas
- Catalogo servicios

Pantallas requeridas:

```text
AdminSucursalesScreen
AdminSucursalFormScreen
AdminTiposHabitacionScreen
AdminTipoHabitacionFormScreen
AdminHabitacionesScreen
AdminHabitacionFormScreen
AdminTarifasScreen
AdminTarifaFormScreen
AdminCatalogoServiciosScreen
AdminCatalogoServicioFormScreen
```

Acciones requeridas:

- listar,
- crear,
- editar,
- eliminar o inhabilitar/desactivar segun servicio web,
- cambio de estado de habitacion,
- politicas de sucursal si existe en web,
- amenidades/imagenes de tipos si estan en web; si la carga nativa de imagenes
  no se implementa, mostrar URLs y dejar pendiente explicito.

Reglas UI:

- Usar listas/cards nativas, no tablas.
- Formularios con `TextInput`, switches y selects simples.
- Validaciones equivalentes a web usando `src/shared/utils/constraints` cuando
  aplique.

Validacion:

```powershell
npm run build
npm run lint
powershell -ExecutionPolicy Bypass -File ..\HotelLuxemburgo\scripts\Test-Backend.ps1 -NoRestore
```

Reporte final:

```text
Pantallas:
Acciones implementadas:
Endpoints usados:
Limitaciones:
Build:
Lint:
Backend:
Metro:
```

---

## Prompt 13 - Reservation admin mobile

Objetivo:

Completar paridad mobile de Reservation:

- Clientes
- Reservas

Estado actual:

- Ya existe listado/detalle parcial de reservas.
- Falta crear reserva admin y CRUD completo de clientes.

Pantallas requeridas:

```text
AdminClientesScreen
AdminClienteFormScreen
AdminReservasScreen (ampliar)
AdminReservaFormScreen
AdminReservaDetailScreen (ampliar)
```

Acciones requeridas:

Clientes:

- listar,
- crear,
- editar,
- eliminar o inhabilitar con motivo.

Reservas:

- listar,
- crear reserva admin,
- detalle completo,
- confirmar,
- cancelar con motivo,
- mostrar habitaciones de reserva.

Reglas:

- No romper booking publico.
- Reutilizar normalizadores ya creados.
- Validar identificacion, telefono, correo y fechas igual que web.

Reporte final:

```text
Clientes:
Reservas:
Endpoints:
Build:
Lint:
Backend:
Metro:
Pendientes:
```

---

## Prompt 14 - Stay admin mobile

Objetivo:

Implementar paridad mobile de Stay:

- Estadias
- Cargos de estadia
- Valoraciones

Pantallas requeridas:

```text
AdminEstadiasScreen
AdminEstadiaDetailScreen
AdminCargoEstadiaFormScreen
AdminValoracionesScreen
AdminValoracionDetailScreen
```

Acciones requeridas:

Estadias:

- listar,
- detalle,
- hacer check-in,
- hacer check-out.

Cargos:

- listar cargos de estadia,
- agregar cargo,
- anular cargo si el servicio lo permite.

Valoraciones:

- listar,
- moderar,
- responder,
- eliminar si existe en web.

Reporte final:

```text
Estadias:
Cargos:
Valoraciones:
Endpoints:
Build:
Lint:
Backend:
Metro:
Pendientes:
```

---

## Prompt 15 - Finance admin mobile

Objetivo:

Implementar paridad mobile de Finance:

- Facturas
- Pagos

Pantallas requeridas:

```text
AdminFacturasScreen
AdminFacturaDetailScreen
AdminPagosScreen
AdminPagoFormScreen
```

Acciones requeridas:

Facturas:

- listar,
- detalle,
- ver pagos de factura,
- generar factura reserva/final si web lo permite,
- anular factura con motivo.

Pagos:

- listar,
- crear,
- aprobar,
- cambiar estado.

Reporte final:

```text
Facturas:
Pagos:
Endpoints:
Build:
Lint:
Backend:
Metro:
Pendientes:
```

---

## Prompt 16 - Auth admin mobile: usuarios, roles, permisos y password

Objetivo:

Implementar funcionalidades de usuarios y roles en mobile.

Aunque `AppRouter.jsx` actualmente redirige esas rutas en web, las paginas
existen y el usuario pidio explicitamente usuarios. Por tanto mobile debe
incluirlas.

Pantallas requeridas:

```text
AdminUsuariosScreen
AdminUsuarioFormScreen
AdminUsuarioRolesScreen
AdminRolesScreen
AdminRolFormScreen
AdminRolPermisosScreen
AdminCambiarPasswordScreen
```

Acciones usuarios:

- listar,
- crear,
- editar,
- eliminar o inhabilitar con motivo,
- ver roles del usuario,
- asignar rol,
- remover rol.

Acciones roles:

- listar,
- crear,
- editar,
- eliminar o inhabilitar,
- listar permisos,
- asignar permiso,
- remover permiso.

Password:

- cambiar password del usuario autenticado.

Reglas:

- Mantener SecureStore para tokens.
- No guardar password en storage.
- Reutilizar `authApi` para auth y `internalApi` para endpoints internos.

Reporte final:

```text
Usuarios:
Roles:
Permisos:
Password:
Endpoints:
Build:
Lint:
Backend:
Metro:
Pendientes:
```

---

## Prompt 17 - Auditoria mobile

Objetivo:

Implementar auditoria mobile solo lectura.

Pantallas:

```text
AdminAuditoriaScreen
AdminAuditoriaDetailScreen
```

Acciones:

- listar eventos con filtros basicos,
- ver detalle de evento,
- mostrar servicio origen, tabla, operacion, usuario, fecha y JSON anterior/nuevo
  de forma legible.

Reglas:

- No publicar eventos desde mobile.
- No conectarse a RabbitMQ.
- Solo consumir `/api/v1/internal/auditoria`.

Reporte final:

```text
Auditoria:
Filtros:
Detalle:
Build:
Lint:
Backend:
Metro:
Pendientes:
```

---

## Prompt 18 - Navegacion, permisos y UX final

Objetivo:

Unificar la experiencia admin mobile despues de agregar todos los modulos.

Cambios:

1. `AdminHomeScreen` debe navegar a todos los modulos.
2. Agregar una navegacion simple por secciones o tabs si la app queda dificil
   de recorrer.
3. Verificar que una sesion expirada regresa a `Login`.
4. Verificar que logout limpia SecureStore.
5. Verificar que todos los formularios tienen:
   - loading,
   - error,
   - success o retorno claro,
   - boton volver/cancelar.
6. Verificar que textos largos no se desbordan.
7. Verificar que no quedan pantallas placeholder.

Validacion:

```powershell
npm run build
npm run lint
powershell -ExecutionPolicy Bypass -File ..\HotelLuxemburgo\scripts\Test-Backend.ps1 -NoRestore
```

Reporte final:

```text
Navegacion:
Sesion:
Pantallas revisadas:
Placeholders restantes:
Build:
Lint:
Backend:
Metro:
Pendientes:
```

---

## Prompt 19 - Prueba de paridad funcional final

Objetivo:

Demostrar que mobile cubre lo mismo que web.

Pasos:

1. Crear una matriz final:

```text
Modulo | Web | Mobile | Acciones probadas | OK/Pendiente
```

2. Probar manualmente en Expo:

Publico:

- buscar,
- detalle,
- reservar,
- pago,
- confirmacion.

Admin:

- login,
- dashboard,
- cada listado,
- cada formulario crear/editar,
- cada accion especial.

3. Ejecutar:

```powershell
npm run build
npm run lint
powershell -ExecutionPolicy Bypass -File ..\HotelLuxemburgo\scripts\Test-Backend.ps1 -NoRestore
```

4. Si Gateway esta levantado:

```powershell
powershell -ExecutionPolicy Bypass -File ..\HotelLuxemburgo\scripts\Test-Backend.ps1 -NoRestore -GatewaySmoke
```

5. Si RabbitMQ esta disponible:

- ejecutar una accion admin que emita auditoria,
- verificar en backend que Audit recibe/persiste,
- no hacer ninguna conexion RabbitMQ desde mobile.

Reporte final:

```text
Paridad:
- Publico:
- Accommodation:
- Reservation:
- Stay:
- Finance:
- Auth/Usuarios/Roles:
- Auditoria:

Validaciones:
- Web build:
- Web lint:
- Backend:
- Gateway smoke:
- Expo:
- RabbitMQ/Audit:

Pendientes reales:
- ...
```

Criterio de aceptacion:

- No hay modulos web sin equivalente mobile.
- No hay pantallas placeholder.
- Web sigue verde.
- Backend sigue verde.
- Expo arranca.
- JWT funciona para internos.
- Auditoria sigue siendo backend-only.
