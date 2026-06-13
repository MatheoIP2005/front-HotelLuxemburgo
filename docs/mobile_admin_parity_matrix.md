# Matriz final de paridad Web vs Mobile — Hotel Luxemburgo

Fecha: 2026-06-10 (Prompt 23)  
Alcance: flujo público + admin. Mobile consume solo Gateway REST (`/api/v1`); sin RabbitMQ, GraphQL ni gRPC directos.

**Leyenda Estado**
- **OK**: pantalla/ruta registrada en ambos lados; acciones implementadas en código mobile
- **OK (Auto)**: verificado build/lint/bundle en esta sesión
- **Manual**: requiere Gateway levantado + Expo Go o navegador (no ejecutado si Gateway apagado)

## Matriz principal

| Modulo | Web ruta/menu | Mobile pantalla/menu | Acciones cubiertas | Estado |
|--------|---------------|----------------------|--------------------|--------|
| Buscar alojamiento | `/buscar` · flujo público | `Search` · stack público `App.js` | Búsqueda por ciudad/fechas/huéspedes vía `publicApi` | OK |
| Detalle alojamiento | `/buscar/:id` | `AccommodationDetail` | Detalle sucursal, habitaciones, continuar reserva | OK |
| Reserva publica | `/reservar` | `BookingForm` | Datos huésped, selección habitación/tarifa | OK |
| Pago simulado | `/pago` | `Payment` | Formulario tarjeta simulado, POST reserva pública | OK |
| Confirmacion | `/confirmacion` | `Confirmation` | Código/GUID reserva creada | OK |
| Dashboard admin | `/admin` · menú Dashboard | `AdminHome` · panel admin | Grid 15 módulos, tabs sección, stats reservas, login/logout | OK |
| Sucursales | `/admin/sucursales` · menú Sucursales | `AdminSucursales` · `adminModules` | Listar, crear, editar, políticas; imágenes URL + galería nativa (`uploadImage`) | OK |
| Tipos habitacion | `/admin/tipos-habitacion` · menú Tipos de Habitación | `AdminTiposHabitacion` · `adminModules` | Listar, crear, editar; imágenes galería+URL; amenidades asignar/quitar | OK |
| Habitaciones | `/admin/habitaciones` · menú Habitaciones | `AdminHabitaciones` · `adminModules` | Listar, crear, editar, cambio estado DIS/MNT | OK |
| Tarifas | `/admin/tarifas` · menú Tarifas | `AdminTarifas` · `adminModules` | Listar, crear, editar, desactivar | OK |
| Catalogo servicios | `/admin/catalogo-servicios` · menú Catálogo Servicios | `AdminCatalogoServicios` · `adminModules` | Listar, crear, editar, desactivar, eliminar | OK |
| Clientes | `/admin/clientes` · menú Clientes | `AdminClientes` · `adminModules` | Listar, crear, editar, inhabilitar con motivo | OK |
| Reservas | `/admin/reservas` · menú Reservas | `AdminReservas` · `adminModules` | Listar, crear admin (`AdminReservaForm`), detalle, confirmar/cancelar | OK |
| Estadias | `/admin/estadias` · menú Estadías | `AdminEstadias` · `adminModules` | Listar; check-in/out (`AdminEstadiaDetail`); cargos (`AdminCargoEstadiaForm`); anular cargo | OK |
| Facturas | `/admin/facturas` · menú Facturas | `AdminFacturas` · `adminModules` | Listar; detalle; generar reserva/final; anular; registrar pago desde factura | OK |
| Pagos | `/admin/pagos` · menú Pagos | `AdminPagos` · `adminModules` | Listar, filtrar, crear (`AdminPagoForm`), aprobar, cambiar estado | OK |
| Valoraciones | `/admin/valoraciones` · menú Valoraciones | `AdminValoraciones` · `adminModules` | Listar; moderar, responder, eliminar (`AdminValoracionDetail`) | OK |
| Usuarios | `/admin/usuarios` · menú Usuarios | `AdminUsuarios` · `adminModules` | Listar, crear, editar, inhabilitar; roles (`AdminUsuarioRoles`) asignar/remover | OK |
| Roles | `/admin/roles` · menú Roles | `AdminRoles` · `adminModules` | Listar, crear, editar; permisos (`AdminRolPermisos`) asignar/remover por ID | OK |
| Cambiar password | `/admin/cambiar-password` · menú Cambiar contraseña | `AdminCambiarPassword` · `adminModules` | Cambio contraseña usuario autenticado vía `authApi` | OK |
| Auditoria | `/admin/auditoria` · menú Auditoría | `AdminAuditoria` · `adminModules` | Listar, filtrar, detalle solo lectura (`AdminAuditoriaDetail`) vía `GET internal/auditoria` | OK |

## Verificación de registro (Prompt 23)

### Mobile — `adminModules.js` + `App.js`

| Área | Pantallas registradas |
|------|----------------------|
| Público (`App.js`) | Search, AccommodationDetail, BookingForm, Payment, Confirmation, Login |
| Admin home | AdminHome |
| Admin listados (`adminRoutes.js` ← `adminModules.js`) | 15 rutas: Sucursales, TiposHabitacion, Habitaciones, Tarifas, CatalogoServicios, Clientes, Reservas, Estadias, Facturas, Pagos, Valoraciones, Usuarios, Roles, CambiarPassword, Auditoria |
| Admin formularios/detalles (`App.js`) | SucursalForm, TipoHabitacionForm, HabitacionForm, TarifaForm, CatalogoServicioForm, ClienteForm, ReservaForm, ReservaDetail, EstadiaDetail, CargoEstadiaForm, ValoracionDetail, FacturaDetail, PagoForm, UsuarioForm, UsuarioRoles, RolForm, RolPermisos, AuditoriaDetail |

- `AdminModulePlaceholderScreen` **eliminado** (Prompt 22); `rg AdminModulePlaceholder mobile/src` → sin coincidencias.
- Todos los módulos en `adminModules.js` tienen `implemented: true` y componente en `IMPLEMENTED_SCREENS`.

### Web — `AppRouter.jsx` + `AdminLayout.jsx`

| Área | Rutas / menú |
|------|----------------|
| Público | `/buscar`, `/buscar/:id`, `/reservar`, `/pago`, `/confirmacion` |
| Admin login | `/admin/login` |
| Admin protegido | `/admin` (Dashboard) + 15 módulos con list/form según módulo |
| Menú lateral | Dashboard, Sucursales, Habitaciones, Tipos de Habitación, Tarifas, Catálogo Servicios, Clientes, Reservas, Estadías, Facturas, Pagos, Valoraciones, Usuarios, Roles, Cambiar contraseña, Auditoría |

Rutas usuarios/roles/password/auditoría **habilitadas** en router (Prompt 20); visibles en menú `AdminLayout.jsx`.

## Acciones especiales admin

| Acción | Web | Mobile | Estado |
|--------|-----|--------|--------|
| Login / logout admin | LoginPage | LoginScreen + SecureStore | OK |
| Confirmar / cancelar reserva | ReservaDetallePage | AdminReservaDetail | OK |
| Check-in / checkout | ReservaDetalle / Estadias | AdminEstadiaDetail | OK |
| Cargo estadía / anular | EstadiasPage | AdminCargoEstadiaForm | OK |
| Generar / anular factura | FacturasPage / ReservaDetalle | AdminFacturas / AdminFacturaDetail | OK |
| Crear / aprobar pago | PagosPage / PagoFormPage | AdminPagos / AdminPagoForm | OK |
| Moderar valoración | ValoracionesPage | AdminValoracionDetail | OK |
| Asignar / remover rol usuario | UsuarioFormPage | AdminUsuarioRoles | OK |
| Asignar / remover permiso rol | RolFormPage | AdminRolPermisos | OK |
| Subir imagen galería | SucursalForm / TipoHabitacionForm (file) | AdminSucursalForm / AdminTipoHabitacionForm (`expo-image-picker` + `images.service`) | OK (código; Manual Gateway) |
| Consultar auditoría | AuditoriaPage | AdminAuditoria + Detail | OK |

## Arquitectura mobile (sin bus de eventos directo)

| Criterio | Resultado |
|----------|-----------|
| JWT | `expo-secure-store` vía `mobileAuthStorage` |
| API interna | `internalApi` → `{API_BASE}/internal` |
| API pública / auth | `publicServices`, `auth.service` |
| RabbitMQ en `mobile/package.json` | No |
| RabbitMQ en `mobile/src` | No referencias |
| GraphQL/gRPC en `mobile/src` | No referencias |
| Imports web-only (`window`, `document`, `localStorage`, `react-router-dom`, `import.meta.env`) en `mobile/src` | 0 coincidencias |

Auditoría: mobile solo **consume** REST; la publicación de eventos es responsabilidad del backend vía RabbitMQ (indirecto).

## Validaciones ejecutadas (Prompt 23)

| Check | Resultado |
|-------|-----------|
| Web build (`npm run build`) | OK (191 módulos) |
| Web lint (`npm run lint`) | OK (0 errores; 1 warning histórico `HabitacionesPage.jsx`) |
| Expo iOS export | OK (876 módulos) |
| Backend (`Test-Backend.ps1 -NoRestore`) | OK — build + 15 tests (Shared 6, Reservation 5, Finance 4) |
| Gateway smoke / manual E2E | **No ejecutado** — Gateway no responde en `http://127.0.0.1:5000` |
| RabbitMQ → auditoría E2E | **No ejecutado** — requiere stack + RabbitMQ levantados |

### Checklist manual pendiente (Gateway + datos de prueba)

Cuando el stack esté activo (`admin` / `admin1234`):

1. Login admin (web y/o mobile)
2. Listar cada módulo admin
3. Crear/editar registro de bajo riesgo
4. Subir imagen desde galería mobile (sucursal o tipo habitación)
5. Reserva pública completa (buscar → confirmación)
6. Confirmar/cancelar reserva admin
7. Check-in/check-out con reserva válida
8. Generar/anular factura; crear/aprobar pago
9. Asignar/remover rol y permiso
10. Acción admin que genere auditoría → verificar en `GET /internal/auditoria` (mobile y web)

## Pendientes reales

1. **Gateway smoke**: levantar stack y ejecutar `Test-Backend.ps1 -NoRestore -GatewaySmoke`
2. **QA manual Expo Go**: recorrer flujos público + admin contra Gateway real
3. **Catálogo permisos**: backend puede devolver stub vacío; asignación por ID funcional en mobile
4. **RabbitMQ indirecto**: validar que acciones admin persisten eventos en auditoría con stack completo
