# Runbook — Expo Go en iPhone (Hotel Luxemburgo)

Guía para ejecutar la app mobile en un **iPhone físico** con **Expo Go**, en la misma red Wi-Fi que el PC donde corre Metro y el Gateway.

Proyecto: **Expo SDK 54** (`mobile/package.json` → `expo ~54.0.0`). Este runbook no cambia funcionalidades; solo prepara la ejecución real.

---

## 1. Requisitos previos

| Requisito | Detalle |
|-----------|---------|
| iPhone + PC | Misma red Wi-Fi (evita datos móviles solo en el teléfono) |
| Expo Go | Instalado/actualizado desde App Store |
| SDK 54 | Expo Go debe soportar SDK 54 (versión reciente de Expo Go; actualizar si Metro muestra incompatibilidad) |
| Gateway | Backend levantado y escuchando en `0.0.0.0:5000` (no solo `localhost`) |
| Node.js | En el PC, desde la raíz `hotel-luxemburgo` |

### Instalar o actualizar Expo Go en iPhone

1. Abre **App Store** en el iPhone.
2. Busca **Expo Go** (editor: Expo Project).
3. Instala o pulsa **Actualizar** para tener la última versión compatible con SDK 54.
4. Si al escanear el QR Metro indica versión de SDK incompatible, actualiza Expo Go y reinicia `npm run mobile:start`.

### Compatibilidad Expo Go (sin dev client)

Dependencias actuales son compatibles con **Expo Go** (no requieren build nativo personalizado):

- `expo-image-picker`
- `expo-secure-store`
- `@react-navigation/*`
- `react-native-screens`, `react-native-safe-area-context`

No agregar librerías que exijan **dev client** o código nativo no incluido en Expo Go.

---

## 2. Obtener la IP LAN del PC (Windows)

En PowerShell:

```powershell
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } |
  Select-Object IPAddress, InterfaceAlias
```

Usa la IPv4 de tu adaptador **Wi-Fi** (ejemplo: `192.168.1.50`).

> **No uses `localhost` ni `127.0.0.1` en el iPhone.** Esas direcciones apuntan al propio teléfono, no al PC.

---

## 3. Verificar Gateway desde el iPhone (Safari)

Antes de abrir Expo Go, confirma que el iPhone alcanza el Gateway.

En **Safari** del iPhone abre:

```text
http://IP_DEL_PC:5000/health
```

Ejemplo:

```text
http://192.168.1.50:5000/health
```

Respuesta esperada: **HTTP 200** con JSON de estado del Gateway.

Endpoints relacionados (opcional, desde el PC):

- `http://127.0.0.1:5000/health`
- `http://127.0.0.1:5000/health/live`
- `http://127.0.0.1:5000/health/ready`

La app mobile usa la API bajo **`/api/v1`** (no el health). El health en Safari solo valida conectividad de red.

---

## 4. Firewall de Windows

Si Safari en el iPhone **no carga** `http://IP_DEL_PC:5000/health`:

1. En el PC, confirma que el Gateway responde en `http://127.0.0.1:5000/health`.
2. Revisa **Firewall de Windows Defender**:
   - Permitir **Node.js** / **dotnet** (proceso del Gateway) en redes **privadas**.
   - O crear regla de entrada **TCP puerto 5000** para perfil **Privado**.
3. Desactiva temporalmente VPN en PC o iPhone si bloquea la LAN.
4. Evita redes invitadas que aíslan clientes (AP isolation).

PowerShell (regla rápida, ejecutar como administrador si aplica):

```powershell
New-NetFirewallRule -DisplayName "HotelLux Gateway 5000" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow -Profile Private
```

Vuelve a probar en Safari del iPhone hasta obtener 200 en `/health`.

---

## 5. Arrancar Metro con IP LAN

Desde la raíz del repo `hotel-luxemburgo`:

```powershell
cd "c:\Users\User\Desktop\Trabajos InSis\hotel-luxemburgo"
$env:EXPO_PUBLIC_API_BASE_URL="http://192.168.1.50:5000/api/v1"
npm run mobile:start
```

Reemplaza `192.168.1.50` por **tu IP LAN real**.

La variable debe apuntar al Gateway con sufijo **`/api/v1`** (igual que la web con `VITE_API_BASE_URL`).

### Conectar Expo Go

1. Abre **Expo Go** en el iPhone.
2. Escanea el **código QR** que muestra Metro (modo LAN).
3. Si el QR falla, en Expo Go usa **Enter URL manually** con la URL `exp://...` que imprime la terminal.
4. Tras cargar la app, prueba:
   - flujo público: Buscar → reserva;
   - admin: Login (`admin` / `admin1234`) → listados.

Si la pantalla de búsqueda muestra aviso de API no configurada, la variable no se aplicó: cierra Metro, vuelve a exportar `$env:EXPO_PUBLIC_API_BASE_URL` y ejecuta `npm run mobile:start` de nuevo.

---

## 6. Credenciales y smoke rápido

| Prueba | Dato |
|--------|------|
| Admin | usuario `admin`, contraseña `admin1234` |
| API base | `http://IP_LAN:5000/api/v1` |
| Auth | `POST .../api/v1/auth/login` |
| Interno | `.../api/v1/internal/*` (JWT en SecureStore) |

Checklist mínimo en iPhone:

- [ ] Safari: `http://IP_LAN:5000/health` → 200
- [ ] Expo Go abre la app sin error de SDK
- [ ] Búsqueda pública responde (Gateway activo)
- [ ] Login admin y un listado (ej. Reservas o Sucursales)

---

## 7. Validación de bundle (CI local)

Confirma que el proyecto sigue exportando para iOS sin dev client:

```powershell
cd mobile
npx expo export --platform ios --clear
```

Debe terminar con **Exported: dist** y sin errores de bundling.

---

## Referencias

- Configuración general mobile: `mobile/README.md`
- Matriz de paridad: `docs/mobile_admin_parity_matrix.md`
- Tests backend: `HotelLuxemburgo/scripts/Test-Backend.ps1 -NoRestore -GatewaySmoke` (con Gateway levantado)
