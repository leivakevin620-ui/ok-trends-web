# O&K Trends — Plataforma de comercio autónomo

Plataforma digital para la tienda O&K Trends: catálogo, carrito, pedidos, inventario, clientes, fidelización, agente comercial y automatizaciones controladas.

## Rama de desarrollo

```text
feature/autonomous-store-platform
```

La implementación HTML anterior se conserva como referencia mientras se completa la migración.

## Módulos implementados

### Tienda pública

- Next.js 16 y React 19.
- TypeScript estricto.
- Diseño responsive con identidad verde esmeralda y dorada.
- Catálogo tipado por categorías.
- Búsqueda y filtros.
- Carrito persistente en el navegador.
- Separación entre productos verificados y contenido de demostración.
- Catálogo cargado mediante un repositorio intercambiable.
- Uso automático de Supabase cuando está configurado.
- Fallback seguro al catálogo local cuando la base no está disponible.
- Checkout bloqueado hasta configurar pagos, contacto y entregas.

### Datos y administración

- Adaptador de catálogo con dos fuentes: seed local seguro y Supabase.
- Acceso del propietario mediante sesión firmada, HttpOnly y con vencimiento.
- Límite de intentos de acceso.
- Panel protegido en `/admin`.
- Vistas de productos e inventario en modo de solo lectura.
- Endpoint autenticado `/api/admin/status`.
- Endpoint público `/api/health` sin secretos y con estados de preparación.
- Edición bloqueada hasta conectar Supabase Auth y aplicar RLS.

### Base de datos

- Esquema inicial normalizado de comercio, CRM, fidelización, conversaciones, automatizaciones y auditoría.
- Función pública restringida `get_public_catalog`.
- Función administrativa `get_admin_inventory_snapshot` con comprobación de permisos.
- Creación automática del perfil al registrar usuarios en Supabase Auth.

## Ejecución local

Requiere Node.js 24 o superior.

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Configuración administrativa temporal

Copiar `.env.example` como `.env.local` y establecer valores privados:

```text
ADMIN_BOOTSTRAP_PASSWORD=<mínimo 12 caracteres>
ADMIN_SESSION_SECRET=<mínimo 32 caracteres aleatorios>
```

Después abrir `http://localhost:3000/admin/login`.

Este acceso de arranque es temporal. Se reemplazará con Supabase Auth antes de habilitar escrituras administrativas en producción.

## Puerta de calidad

```bash
npm run check
```

Ejecuta:

1. TypeScript.
2. ESLint.
3. Pruebas unitarias.
4. Build de producción.

GitHub Actions ejecuta la misma puerta de calidad en cada cambio de la rama.

## Variables de entorno

Copiar `.env.example` como `.env.local` y completar únicamente los valores autorizados. Nunca subir credenciales reales al repositorio.

## Seguridad operativa

Las siguientes capacidades permanecen bloqueadas hasta configurar proveedores oficiales y superar pruebas:

- edición persistente de inventario;
- cobros;
- confirmación automática de pagos;
- mensajería masiva;
- publicación automática en redes;
- reembolsos;
- descuentos extraordinarios.

## Documentación

- Auditoría inicial: `docs/audits/2026-07-15-initial-audit.md`.
- Arquitectura: `docs/architecture.md`.
- Estado funcional: `docs/status.md`.
- Migraciones: `supabase/migrations/`.

## Licencia

Revisar `LICENSE` antes de publicar o distribuir versiones derivadas.
