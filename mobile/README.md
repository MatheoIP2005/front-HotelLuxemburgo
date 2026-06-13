# Hotel Luxemburgo Mobile

App React Native/Expo paralela al frontend web. Esta primera version implementa
el flujo publico de reserva:

- busqueda de alojamientos,
- detalle y seleccion de habitacion,
- datos del cliente,
- pago simulado,
- creacion de reserva publica contra el Gateway.

## Expo Go en iPhone (dispositivo fisico)

Guia completa: [`../docs/expo_go_runbook.md`](../docs/expo_go_runbook.md)

Resumen:

1. Instala/actualiza **Expo Go** en el iPhone (compatible con **SDK 54**).
2. Conecta iPhone y PC a la **misma Wi-Fi**.
3. Obtén la **IP LAN** del PC (no uses `localhost` en el telefono).
4. En Safari del iPhone prueba `http://IP_LAN:5000/health` antes de abrir la app.
5. Arranca Metro con la API en IP LAN:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://192.168.1.50:5000/api/v1"
npm run mobile:start
```

Si el iPhone no alcanza el Gateway, revisa el **firewall de Windows** (puerto 5000, perfil Privado).

## Configuracion del Gateway

La app debe apuntar al Gateway publico bajo `/api/v1`, igual que la web.

Variable principal:

```text
EXPO_PUBLIC_API_BASE_URL=http://<host>:5000/api/v1
```

`127.0.0.1` solo funciona en el simulador iOS o en la misma maquina donde corre
Metro en modo web. En emulador Android y en celular fisico necesitas otra URL.

### Por plataforma

| Entorno | Host recomendado | Ejemplo |
| --- | --- | --- |
| Simulador iOS | `127.0.0.1` | `http://127.0.0.1:5000/api/v1` |
| Emulador Android | `10.0.2.2` (alias del host) | `http://10.0.2.2:5000/api/v1` |
| Celular fisico | IP LAN de tu PC | `http://192.168.1.20:5000/api/v1` |

### PowerShell (desde `hotel-luxemburgo`)

Simulador iOS o prueba local en Windows:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://127.0.0.1:5000/api/v1"
npm run mobile:start
```

Emulador Android:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://10.0.2.2:5000/api/v1"
npm run mobile:start
```

Celular fisico (reemplaza por tu IP LAN):

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://192.168.1.20:5000/api/v1"
npm run mobile:start
```

Para obtener la IP LAN en Windows:

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } | Select-Object IPAddress, InterfaceAlias
```

Asegurate de que el celular y la PC esten en la misma red Wi-Fi y que el
firewall permita conexiones entrantes al puerto `5000`.

### Alternativa: `app.json`

Tambien puedes definir un valor por defecto en `mobile/app.json`:

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "http://10.0.2.2:5000/api/v1"
    }
  }
}
```

`EXPO_PUBLIC_API_BASE_URL` tiene prioridad sobre `expo.extra.apiBaseUrl`.

### Si falta la URL

Si no configuras ninguna URL:

- Metro sigue arrancando con normalidad.
- La app muestra un aviso visible en la pantalla de busqueda.
- La consola registra un `console.warn` con la pista segun plataforma.
- Las llamadas REST no se ejecutan hasta definir la variable.

## Comandos

Desde la raiz `hotel-luxemburgo`:

```powershell
npm run mobile:install
$env:EXPO_PUBLIC_API_BASE_URL="http://127.0.0.1:5000/api/v1"
npm run mobile:start
```

O desde `hotel-luxemburgo/mobile`:

```powershell
npm install
$env:EXPO_PUBLIC_API_BASE_URL="http://127.0.0.1:5000/api/v1"
npm run start
```

## Validacion esperada

Antes de probar mobile, confirma el backend:

```powershell
powershell -ExecutionPolicy Bypass -File ..\HotelLuxemburgo\scripts\Test-Backend.ps1 -NoRestore
```

Con el Gateway levantado:

```powershell
powershell -ExecutionPolicy Bypass -File ..\HotelLuxemburgo\scripts\Test-Backend.ps1 -NoRestore -GatewaySmoke
```

Para web, seguir usando:

```powershell
npm run build
npm run lint
```

## Nota de alcance

RabbitMQ y el bus de eventos son internos del backend. La app mobile no se
conecta a RabbitMQ; crea reservas por Gateway REST y el backend publica
auditoria.
