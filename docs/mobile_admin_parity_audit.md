# Auditoria de paridad mobile vs web

Fecha: 2026-06-10

## Resultado ejecutivo

La app mobile ya tiene:

- booking publico,
- login admin,
- home admin basico,
- listado de reservas,
- detalle de reserva,
- confirmar/cancelar reserva.

Esto NO cumple paridad con el frontend web. El web administra muchos mas
modulos y tambien contiene pantallas de usuarios/roles aunque hoy algunas rutas
esten redirigidas en `AppRouter.jsx`.

## Regla de alcance actualizada

La app React Native debe tener las mismas funcionalidades que la web:

- funcionalidades publicas de booking,
- funcionalidades de administrador,
- funcionalidades de usuarios/roles si existen en el frontend web,
- acciones principales de cada modulo,
- validaciones equivalentes,
- consumo del mismo Gateway REST,
- JWT en endpoints internos,
- sin conexion directa a RabbitMQ ni gRPC.

## Estado mobile actual

Pantallas existentes:

- `SearchScreen`
- `AccommodationDetailScreen`
- `BookingFormScreen`
- `PaymentScreen`
- `ConfirmationScreen`
- `LoginScreen`
- `AdminHomeScreen`
- `AdminReservasScreen`
- `AdminReservaDetailScreen`

Servicios mobile existentes:

- `auth.service.js`
- `publicServices.js`
- `reservas.service.js`

## Modulos web con paridad requerida

### Publico

| Modulo web | Estado mobile | Pendiente |
| --- | --- | --- |
| Buscar alojamientos | Parcial/OK | Smoke real contra Gateway |
| Detalle alojamiento | Parcial/OK | Validar habitaciones y `tipoHabitacionGuid` |
| Formulario reserva | Parcial/OK | Validar payload real |
| Pago simulado | Parcial/OK | Validar creacion reserva |
| Confirmacion | Parcial/OK | Validar codigo/reservaGuid |

### Administracion activa en router web

| Modulo web | Rutas web | Estado mobile | Pendiente |
| --- | --- | --- | --- |
| Dashboard | `/admin` | Parcial | Ampliar stats o accesos a todos los modulos |
| Sucursales | `/admin/sucursales`, crear, editar | Faltante | CRUD + politicas + imagenes si aplica |
| Tipos habitacion | `/admin/tipos-habitacion`, crear, editar | Faltante | CRUD + imagenes + amenidades |
| Habitaciones | `/admin/habitaciones`, crear, editar | Faltante | CRUD + cambio estado |
| Tarifas | `/admin/tarifas`, crear, editar | Faltante | CRUD + desactivar |
| Catalogo servicios | `/admin/catalogo-servicios`, crear, editar | Faltante | CRUD + desactivar |
| Clientes | `/admin/clientes`, crear, editar | Faltante | CRUD + inhabilitar |
| Reservas | `/admin/reservas`, crear, detalle | Parcial | Falta crear reserva admin y detalle completo |
| Estadias | `/admin/estadias` | Faltante | Listado + check-in/out + cargos |
| Facturas | `/admin/facturas` | Faltante | Listado/detalle + generar/anular |
| Pagos | `/admin/pagos`, crear | Faltante | Listado + crear + aprobar/cambiar estado |
| Valoraciones | `/admin/valoraciones` | Faltante | Listado + moderar/responder/eliminar |

### Pantallas web existentes pero redirigidas actualmente

Estas pantallas existen en `src/pages/admin`, aunque `AppRouter.jsx` las
redirige al dashboard:

| Modulo | Estado mobile | Decision requerida |
| --- | --- | --- |
| Usuarios | Faltante | Implementar porque el usuario pidio usuarios |
| Roles | Faltante | Implementar junto con permisos |
| Cambiar password | Faltante | Implementar si se requiere paridad real |
| Auditoria | Faltante | Implementar si se cuenta como funcionalidad web |

## Servicios web que deben tener equivalente mobile/shared

- `sucursales.service.js`
- `sucursalImagenes.service.js`
- `tiposHabitacion.service.js`
- `tipoHabitacionImagenes.service.js`
- `tipoHabitacionAmenidades.service.js`
- `habitaciones.service.js`
- `tarifas.service.js`
- `catalogoServicios.service.js`
- `clientes.service.js`
- `reservas.service.js`
- `estadias.service.js`
- `cargosEstadia.service.js`
- `facturas.service.js`
- `pagos.service.js`
- `valoraciones.service.js`
- `usuarios.service.js`
- `roles.service.js`
- `permisos.service.js`
- `auditoria.service.js`
- `auth.service.js`

## Recomendacion de implementacion

No hacer un unico prompt gigante.

Implementar por dominios:

1. Infraestructura mobile admin reutilizable.
2. Accommodation: sucursales, tipos, habitaciones, tarifas, catalogo.
3. Reservation: clientes, reservas admin.
4. Stay: estadias, cargos, valoraciones.
5. Finance: facturas, pagos.
6. Auth/Admin: usuarios, roles, permisos, cambiar password.
7. Audit: auditoria solo lectura.
8. Prueba integrada final.

Cada dominio debe compilar y probar antes de avanzar.

## Comandos obligatorios

Despues de cada dominio:

```powershell
npm run build
npm run lint
powershell -ExecutionPolicy Bypass -File ..\HotelLuxemburgo\scripts\Test-Backend.ps1 -NoRestore
```

Si Expo esta disponible:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://127.0.0.1:5000/api/v1"
npm run mobile:start
```

## Criterio final de paridad

La entrega solo esta completa si:

- mobile permite usar booking publico,
- mobile permite login admin,
- mobile tiene navegacion a todos los modulos web,
- cada modulo tiene listado,
- cada modulo con formulario web tiene crear/editar mobile,
- cada accion web relevante existe en mobile,
- los endpoints internos usan JWT,
- build/lint/backend pasan,
- no hay conexion frontend directa a RabbitMQ/gRPC.
