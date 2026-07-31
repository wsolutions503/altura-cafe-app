# Altura Café — App de Pedidos

Sistema de pedidos para Altura Café, construido con el mismo motor que la app del Comedor Lety
(React + Vite + Firebase Firestore en tiempo real).

## Qué incluye

- Menú del día por categorías: Cafés Calientes, Cafés Helados, Frappuccinos, Matcha, Bowls y Extras
  (precargado con los productos de tu menú actual).
- Carrito de compras y pedido con opción de **entrega a domicilio** (con horario) o **recoger en tienda**.
- Registro / inicio de sesión de clientes, "Mis Pedidos", cambio y recuperación de clave.
- Panel de administrador:
  - **Pedidos**: por horario, para recoger en tienda, y resumen de productos a preparar.
  - **Menú**: catálogo de productos + selección del menú activo del día (se desactiva solo a las 6:00 PM).
  - **Especiales**: promociones/temporada con imagen.
  - **Reportes**: ventas por rango de fechas, top de productos vendidos, historial por día.
  - **Clientes**: listado, historial de compras, reseteo de clave con envío por WhatsApp.
  - **Config**: nombre, logo, teléfono, dirección y descripción del café.

## 1. Crear tu proyecto de Firebase

Este café necesita su **propio** proyecto de Firebase (distinto al de Comedor Lety):

1. Ve a https://console.firebase.google.com y crea un proyecto nuevo, por ejemplo `altura-cafe`.
2. Activa **Firestore Database** (modo producción o prueba).
3. Ve a *Configuración del proyecto → Tus apps → Web* y registra una app web.
4. Copia el objeto `firebaseConfig` que te da Firebase.
5. Abre `src/App.jsx` y reemplaza el bloque `FIREBASE_CONFIG` (líneas cerca del inicio del archivo) con
   tus propios valores (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).

## 2. Instalar y correr en desarrollo

```bash
npm install
npm run dev
```

## 3. Publicar (GitHub Pages, igual que Lety)

```bash
npm run deploy
```

(Antes actualiza `homepage` en `package.json` con tu usuario/repositorio de GitHub.)

## Acceso de administrador

- Usuario: `admin`
- Contraseña: `altura2024`

Cámbialos en `src/App.jsx`, función `loginAdmin`, antes de publicar la app.

## Personalizar el menú

Los productos iniciales (catálogo) están en `DEF_CATALOG` dentro de `src/App.jsx`, pero una vez
publicada la app puedes agregar, editar o quitar productos directamente desde el Panel de
Administración → pestaña Menú, sin tocar código.
