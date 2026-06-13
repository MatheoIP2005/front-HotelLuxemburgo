# Prompts para Cursor - React Native / Expo en Hotel Luxemburgo

Este documento es la guia de trabajo para que Cursor implemente y valide la
funcionalidad mobile sin romper el frontend web ni la integracion con el
backend.

> Nota de alcance actualizada: Cursor ya ejecuto estos prompts hasta el Prompt
> 9. El alcance de "admin limitado" ya no es suficiente. Para continuar, usar
> `docs/cursor_prompts_mobile_admin_parity.md`, que exige paridad total con la
> web, incluyendo administrador y usuarios.

## Contexto del proyecto

### Frontend

Raiz: `hotel-luxemburgo/`

Stack actual:

- React + Vite.
- React DOM.
- `react-router-dom`.
- CSS Modules.
- Axios.
- `localStorage` para tokens.

Scripts web actuales:

```powershell
npm run dev
npm run build
npm run lint
npm run preview
```

Estructura relevante:

- `src/api`: clientes Axios web.
- `src/services`: servicios de dominio consumidos por paginas web.
- `src/shared`: capa compartible creada para web/mobile.
- `src/platform`: adaptadores por plataforma, por ahora storage web.
- `mobile`: app React Native/Expo paralela.

### Backend

Raiz: `../HotelLuxemburgo/`

Stack actual:

- .NET 8 por microservicios.
- Gateway YARP en `HotelLux.Gateway`.
- REST publico/interno por Gateway bajo `/api/v1`.
- GraphQL en Gateway bajo `/graphql`.
- gRPC interno entre microservicios.
- RabbitMQ + MassTransit para auditoria.
- Audit consumer persiste eventos en `HotelLux_Audit`.

Punto clave:

La app web y la app mobile NO deben conectarse a RabbitMQ ni gRPC. El frontend
solo debe consumir el Gateway por REST y, si aporta valor real, GraphQL.

## Auditoria rapida ya realizada

Hallazgos frontend:

- La web compila con Vite.
- `npm run lint` tiene un warning historico en
  `src/pages/admin/habitaciones/HabitacionesPage.jsx` por dependencia faltante
  de `useMemo`.
- El frontend original dependia de APIs web (`localStorage`, `window`,
  `document`, `BrowserRouter`, DOM y CSS Modules), por eso no conviene intentar
  convertirlo completo a React Native de golpe.
- Los servicios publicos de alojamientos y reservas son buenos candidatos para
  compartirse entre web y mobile.

Hallazgos backend:

- El backend tiene Gateway con REST y GraphQL.
- RabbitMQ/EventBus es transparente para el frontend.
- Los endpoints publicos relevantes para mobile son:
  - `GET /api/v1/accommodations/search`
  - `GET /api/v1/accommodations/{sucursalGuid}`
  - `GET /api/v1/accommodations/{sucursalGuid}/reviews`
  - `POST /api/v1/accommodations/reservas`
- GraphQL expone:
  - `accommodationsSearch`
  - `accommodation`
  - `accommodationReviews`
  - `reservation`
  - `createReservation`

## Decision tecnica

Implementar una app React Native/Expo paralela en `mobile/`, compartiendo
servicios y utilidades con la web.

No migrar todo el frontend web a React Native Web en un solo paso.

Razon:

- La web actual usa DOM, CSS Modules y `react-router-dom`.
- Reescribir toda la UI admin/publica seria de mayor riesgo.
- Una app Expo paralela permite cumplir React Native y mantener web estable.
- La capa compartida evita duplicar logica de API y payloads.

## Guia paso a paso

1. Mantener la web funcionando.
   No romper imports existentes desde `src/services` ni `src/api`.

2. Separar capa compartida.
   Usar:
   - `src/shared/api/httpClient.js`
   - `src/shared/services/accommodations.service.js`
   - `src/shared/services/publicReservas.service.js`
   - `src/shared/utils/api.js`

3. Mantener adaptadores por plataforma.
   Web usa:
   - `src/platform/webAuthStorage.js`

   Mobile debe usar storage propio cuando se implemente auth:
   - AsyncStorage o SecureStore.

4. Usar Gateway como unica entrada.
   Configurar web con:

   ```text
   VITE_API_BASE_URL=http://127.0.0.1:5000/api/v1
   ```

   Configurar mobile con:

   ```powershell
   $env:EXPO_PUBLIC_API_BASE_URL="http://127.0.0.1:5000/api/v1"
   ```

   En celular fisico usar IP LAN, no `127.0.0.1`.

5. Implementar primero flujo publico mobile.
   Orden recomendado:
   - SearchScreen.
   - AccommodationDetailScreen.
   - BookingFormScreen.
   - PaymentScreen.
   - ConfirmationScreen.

6. Validar tipo de habitacion antes de reservar.
   Para `POST /api/v1/accommodations/reservas`, no inventar
   `tipoHabitacionGuid`. Si el detalle no lo devuelve, revisar REST/GraphQL.

7. Solo considerar GraphQL si reduce complejidad.
   REST ya funciona y es el camino mas seguro. GraphQL puede ser util si mobile
   necesita menos llamadas o datos agregados.

8. Implementar auth/admin mobile solo si el alcance lo exige.
   El primer alcance recomendado es booking publico. Admin completo requiere
   redisenar tablas, formularios largos, imagenes, permisos y navegacion.

## Comandos obligatorios

Antes y despues de cada prompt que toque codigo:

```powershell
npm run build
npm run lint
powershell -ExecutionPolicy Bypass -File ..\HotelLuxemburgo\scripts\Test-Backend.ps1 -NoRestore
```

Si se toca mobile:

```powershell
npm run mobile:install
$env:EXPO_PUBLIC_API_BASE_URL="http://127.0.0.1:5000/api/v1"
npm run mobile:start
```

Si el Gateway esta levantado, probar:

```powershell
powershell -ExecutionPolicy Bypass -File ..\HotelLuxemburgo\scripts\Test-Backend.ps1 -NoRestore -GatewaySmoke
```

Regla:

Si un comando falla, detenerse, corregir, y volver a ejecutar. No continuar con
el siguiente prompt dejando errores abiertos.

---

## Prompt 1 - Verificar baseline web/backend antes de tocar mobile

Quiero que verifiques el estado base del proyecto antes de seguir con React
Native.

Contexto:

- Web: `hotel-luxemburgo/`
- Backend: `../HotelLuxemburgo/`
- No hagas cambios de codigo en este prompt.

Pasos:

1. Ejecutar en `hotel-luxemburgo`:

```powershell
npm run build
npm run lint
```

2. Ejecutar en `hotel-luxemburgo`:

```powershell
powershell -ExecutionPolicy Bypass -File ..\HotelLuxemburgo\scripts\Test-Backend.ps1 -NoRestore
```

3. Revisar:

```powershell
git status --short
```

Criterios de aceptacion:

- Build web OK.
- Lint sin errores. Si hay warnings existentes, reportarlos sin corregir salvo
  que bloqueen el trabajo.
- Backend build/tests OK.

Reporte final requerido:

```text
Build web:
Lint web:
Backend:
Warnings existentes:
Cambios sin commit:
Bloqueos:
```

---

## Prompt 2 - Revisar o crear capa compartida para API

Quiero que confirmes que la capa compartida entre web y mobile esta correcta.

Archivos esperados:

- `src/shared/api/httpClient.js`
- `src/shared/utils/api.js`
- `src/shared/services/accommodations.service.js`
- `src/shared/services/publicReservas.service.js`
- `src/platform/webAuthStorage.js`

Reglas:

- No romper imports actuales desde `src/services`.
- La web debe seguir importando `searchAccommodations`, `getAccommodation`,
  `createPublicReserva`, etc. desde `src/services`.
- `src/api/authApi.js` e `src/api/internalApi.js` deben usar un cliente
  autenticado inyectando storage web.
- El codigo compartido no debe usar `window`, `document`, `localStorage` ni
  `import.meta.env`.

Pasos:

1. Revisar que `src/shared` no tenga dependencias web.
2. Revisar que los servicios web re-exporten factories compartidas.
3. Ejecutar:

```powershell
npm run build
npm run lint
```

Criterios de aceptacion:

- La web compila.
- Lint sin errores.
- La capa compartida queda lista para ser importada desde `mobile/`.

Reporte final requerido:

```text
Archivos revisados/modificados:
Dependencias web eliminadas de shared:
Build:
Lint:
Riesgos:
```

---

## Prompt 3 - Instalar dependencias Expo y validar Metro

Quiero que instales y levantes la app React Native/Expo paralela.

Contexto:

La app mobile vive en:

```text
hotel-luxemburgo/mobile
```

Archivos esperados:

- `mobile/package.json`
- `mobile/app.json`
- `mobile/babel.config.js`
- `mobile/metro.config.js`
- `mobile/App.js`

Pasos:

1. Desde `hotel-luxemburgo`, ejecutar:

```powershell
npm run mobile:install
```

2. Configurar Gateway local:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://127.0.0.1:5000/api/v1"
```

3. Levantar Expo:

```powershell
npm run mobile:start
```

4. Confirmar que Metro no falla por:
   - versiones incompatibles de Expo,
   - imports fuera de `mobile`,
   - resolucion de `node_modules`,
   - falta de `react-native-screens`,
   - falta de `react-native-safe-area-context`.

Si falla por versiones, corregir `mobile/package.json` usando versiones
compatibles con la version de Expo instalada. Luego repetir `npm run
mobile:install`.

No modificar backend en este prompt.

Criterios de aceptacion:

- `mobile/node_modules` existe.
- Expo arranca.
- Metro no muestra errores rojos iniciales.

Reporte final requerido:

```text
Dependencias instaladas:
Expo/Metro:
Errores corregidos:
Comandos ejecutados:
Pendientes:
```

---

## Prompt 4 - Validar flujo publico mobile con REST

Quiero que pruebes el flujo publico mobile completo consumiendo REST del Gateway.

Requisitos:

- Backend levantado.
- Gateway en `http://127.0.0.1:5000`.
- `EXPO_PUBLIC_API_BASE_URL` configurado con `/api/v1`.
- Expo corriendo.

Pantallas:

- `mobile/src/screens/SearchScreen.js`
- `mobile/src/screens/AccommodationDetailScreen.js`
- `mobile/src/screens/BookingFormScreen.js`
- `mobile/src/screens/PaymentScreen.js`
- `mobile/src/screens/ConfirmationScreen.js`

Pasos funcionales:

1. Buscar alojamientos con fechas validas.
2. Abrir detalle de una sucursal.
3. Verificar datos principales:
   - nombre,
   - ubicacion,
   - rating,
   - precio,
   - habitaciones.
4. Seleccionar habitacion.
5. Completar datos del cliente.
6. Confirmar pago simulado.
7. Verificar que se ejecuta:

```http
POST /api/v1/accommodations/reservas
```

8. Confirmar que aparece pantalla de confirmacion.

Reglas:

- No inventar GUIDs.
- Si falta `tipoHabitacionGuid`, revisar respuesta del detalle y reportar el
  bug de contrato.
- No conectar mobile a RabbitMQ.
- No saltarse validaciones de cliente.

Validacion despues de cualquier fix:

```powershell
npm run build
npm run lint
```

Si se toca backend:

```powershell
powershell -ExecutionPolicy Bypass -File ..\HotelLuxemburgo\scripts\Test-Backend.ps1 -NoRestore
```

Reporte final requerido:

```text
Flujo probado:
Busqueda:
Detalle:
Reserva payload:
Respuesta backend:
Pantalla confirmacion:
Build:
Lint:
Pendientes reales:
```

---

## Prompt 5 - Revisar si GraphQL conviene para mobile

Quiero evaluar tecnicamente si mobile debe usar GraphQL en lugar de REST para el
flujo publico.

Contexto:

Gateway expone `/graphql` con:

- `accommodationsSearch`
- `accommodation`
- `accommodationReviews`
- `reservation`
- `createReservation`

Reglas:

- No reemplazar REST si no reduce llamadas o complejidad.
- No modificar backend salvo bug reproducible.
- Mantener REST como fallback.
- No usar GraphQL para endpoints internos admin en este paso.

Pasos:

1. Probar introspeccion basica:

```powershell
$body = @{ query = "{ __typename }" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://127.0.0.1:5000/graphql" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
```

2. Probar query real de `accommodationsSearch`.
3. Comparar payload REST vs GraphQL para mobile.
4. Si GraphQL conviene, crear cliente GraphQL mobile separado:

```text
mobile/src/api/graphqlClient.js
mobile/src/services/graphqlPublicServices.js
```

5. No borrar servicios REST.

Validacion:

```powershell
npm run build
npm run lint
powershell -ExecutionPolicy Bypass -File ..\HotelLuxemburgo\scripts\Test-Backend.ps1 -NoRestore -GatewaySmoke
```

Reporte final requerido:

```text
Decision:
Motivo:
Queries probadas:
Archivos modificados:
Build:
Lint:
Gateway smoke:
Pendientes:
```

---

## Prompt 6 - Mejorar manejo de entorno mobile

Quiero robustecer la configuracion de entorno de la app mobile.

Objetivo:

Evitar errores comunes cuando se prueba desde emulador Android, iOS simulator o
celular fisico.

Pasos:

1. Revisar `mobile/src/config/env.js`.
2. Documentar claramente:
   - Android emulator: puede usar `10.0.2.2` si Gateway corre local.
   - iOS simulator: puede usar `127.0.0.1`.
   - celular fisico: debe usar IP LAN del equipo.
3. Agregar ejemplos a `mobile/README.md`.
4. Validar que si no hay `EXPO_PUBLIC_API_BASE_URL`, la app muestra warning
   claro y no rompe Metro.

Validacion:

```powershell
npm run build
npm run lint
```

Reporte final requerido:

```text
README actualizado:
Config validada:
Build:
Lint:
Pendientes:
```

---

## Prompt 7 - Implementar auth mobile solo si se requiere admin

Quiero implementar autenticacion mobile solo si el alcance del parcial exige
panel admin o funciones privadas.

Antes de codificar, confirmar alcance:

- booking publico solamente,
- admin limitado,
- admin completo.

Si se aprueba auth mobile:

1. Instalar storage seguro:

```powershell
npm install --prefix mobile expo-secure-store
```

O AsyncStorage:

```powershell
npm install --prefix mobile @react-native-async-storage/async-storage
```

2. Crear:

```text
mobile/src/platform/mobileAuthStorage.js
mobile/src/api/authApi.js
mobile/src/context/AuthContext.js
mobile/src/screens/LoginScreen.js
```

3. Reutilizar:

```text
src/shared/api/httpClient.js
```

4. No usar:

```text
localStorage
window
document
react-router-dom
```

5. Enviar JWT por:

```http
Authorization: Bearer <token>
```

6. Probar:

```http
POST /api/v1/auth/login
```

Validacion:

```powershell
npm run build
npm run lint
```

Y smoke manual de login en Expo.

Reporte final requerido:

```text
Alcance confirmado:
Storage usado:
Login:
Persistencia sesion:
Build:
Lint:
Pendientes:
```

---

## Prompt 8 - Panel admin mobile limitado

Solo ejecutar si el usuario confirma que el parcial exige admin mobile.

Objetivo:

Implementar un panel admin reducido, no el admin completo web.

Recomendacion de alcance inicial:

- login admin,
- dashboard simple,
- listado de reservas,
- detalle de reserva,
- accion confirmar/cancelar si el backend lo permite.

Reglas:

- No portar tablas web literalmente a mobile.
- Usar listas/cards nativas.
- Mantener endpoints internos por Gateway.
- Reutilizar cliente autenticado.
- No romper rutas admin web.

Validacion:

```powershell
npm run build
npm run lint
powershell -ExecutionPolicy Bypass -File ..\HotelLuxemburgo\scripts\Test-Backend.ps1 -NoRestore
```

Reporte final requerido:

```text
Pantallas admin mobile:
Endpoints usados:
Permisos/JWT:
Build:
Lint:
Backend:
Pendientes:
```

---

## Prompt 9 - Prueba integrada final web + mobile + backend

Quiero hacer la verificacion final antes de entregar el parcial.

Pasos:

1. Revisar cambios:

```powershell
git status --short
```

2. Validar web:

```powershell
npm run build
npm run lint
```

3. Validar backend:

```powershell
powershell -ExecutionPolicy Bypass -File ..\HotelLuxemburgo\scripts\Test-Backend.ps1 -NoRestore
```

4. Si Gateway esta levantado:

```powershell
powershell -ExecutionPolicy Bypass -File ..\HotelLuxemburgo\scripts\Test-Backend.ps1 -NoRestore -GatewaySmoke
```

5. Validar Expo:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://127.0.0.1:5000/api/v1"
npm run mobile:start
```

6. Probar manualmente:
   - busqueda,
   - detalle,
   - reserva publica,
   - confirmacion.

7. Si RabbitMQ esta disponible, confirmar que una operacion real genera evento
   de auditoria en backend. No probar RabbitMQ desde mobile.

Reporte final requerido:

```text
Archivos modificados:
- ...

Web:
- Build:
- Lint:

Mobile:
- Install:
- Expo/Metro:
- Flujo publico:
- Reserva creada:

Backend:
- Build/tests:
- Gateway smoke:
- RabbitMQ/Audit:

GraphQL:
- Usado/no usado:
- Motivo:

Pendientes reales:
- ...
```

Criterio de aceptacion final:

- Web sigue compilando.
- Lint no tiene errores.
- Backend sigue verde.
- Expo arranca.
- La app mobile permite crear una reserva publica real o queda identificado un
  bloqueo de contrato especifico.
- No hay conexion frontend -> RabbitMQ.
- Los cambios estan documentados.
