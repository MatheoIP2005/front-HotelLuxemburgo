# Hotel Luxemburgo Frontend

Frontend React + Vite para administracion y reservas publicas de Hotel Luxemburgo.

## Variables de entorno

Copia `.env.example` a `.env` para desarrollo local y configura estas variables en el proveedor de deploy, por ejemplo Vercel.

```env
VITE_API_BASE_URL=https://TU-GATEWAY-DESPLEGADO/api/v1
VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=tu_upload_preset_unsigned
```

## Imagenes con Cloudinary

El formulario de sucursales y tipos de habitacion usa `src/services/images.service.js`.

Si `VITE_CLOUDINARY_CLOUD_NAME` y `VITE_CLOUDINARY_UPLOAD_PRESET` existen, el archivo se sube directo a Cloudinary y se guarda la `secure_url` en la API interna de imagenes. Si no existen, el frontend conserva el flujo anterior contra `/internal/images/upload`.

Para configurarlo:

1. En Cloudinary, crea un upload preset sin firma para imagenes.
2. Define `VITE_CLOUDINARY_CLOUD_NAME` con el cloud name de tu cuenta.
3. Define `VITE_CLOUDINARY_UPLOAD_PRESET` con el nombre del preset.
4. En el preset, configura la carpeta de destino, por ejemplo `hotel-luxemburgo`.
5. En Vercel, agrega las mismas variables y vuelve a desplegar.

No agregues `API_SECRET` de Cloudinary al frontend. Si en el futuro necesitas cargas firmadas, la firma debe generarse en el backend.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## App movil React Native

La app mobile paralela vive en `mobile/` y usa Expo. Comparte servicios
publicos con la web y consume el mismo Gateway configurado con
`EXPO_PUBLIC_API_BASE_URL`.

```bash
npm run mobile:install
npm run mobile:start
```

Ver `mobile/README.md` para configuracion local y notas de validacion.

**iPhone fisico con Expo Go:** guia paso a paso en [`docs/expo_go_runbook.md`](docs/expo_go_runbook.md) (IP LAN, Safari `/health`, firewall).
