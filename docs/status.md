# Estado funcional

## Implementada y probada

- Aplicación Next.js con TypeScript estricto.
- Página pública responsive e identidad visual de O&K Trends.
- Catálogo tipado, búsqueda y filtros.
- Carrito persistente en `localStorage` y cálculo de subtotal.
- Bloqueo de productos sin precio verificado.
- Cabeceras HTTP básicas de seguridad.
- Endpoint público `/api/health`.
- Adaptador de catálogo con seed seguro y Supabase.
- Fallback automático cuando Supabase está ausente o falla.
- Sesión administrativa firmada, HttpOnly y con vencimiento.
- Límite de intentos en el acceso administrativo.
- Panel protegido `/admin`.
- Vista protegida de productos.
- Vista protegida de inventario.
- Endpoint autenticado `/api/admin/status`.
- Pruebas de seguridad de sesión, entorno y repositorio.
- GitHub Actions ejecuta TypeScript, ESLint, pruebas unitarias y build.

## Preparada, no aplicada

- Migración inicial de PostgreSQL para Supabase.
- Función pública restringida `get_public_catalog`.
- Función administrativa `get_admin_inventory_snapshot`.
- Trigger de creación automática de perfiles con Supabase Auth.
- RLS base.
- Roles y permisos.
- Inventario y movimientos.
- Pedidos y pagos.
- CRM.
- Fidelización.
- Conversaciones.
- Automatizaciones.
- Auditoría.
- Seed de desarrollo.

## Simulada o temporal

- Catálogo local usado cuando Supabase no está configurado.
- Acceso administrativo bootstrap mediante variables privadas del servidor.
- Panel de productos e inventario en modo solo lectura.
- Proveedor de inteligencia artificial en modo `simulation`.

## Pendiente de credenciales

- Proyecto Supabase exclusivo para O&K Trends.
- Usuario propietario creado en Supabase Auth.
- Despliegue Vercel conectado a la rama.
- WhatsApp Business oficial.
- Pasarela de pago.
- Proveedor de correo.
- Proveedor de IA.
- n8n y webhook autenticado.

## Pendiente de decisión del propietario

- Dirección oficial.
- Teléfono y WhatsApp comercial.
- Horarios.
- Métodos de pago.
- Cobertura y tarifas de entrega.
- Políticas de cambios, devoluciones y privacidad.
- Inventario definitivo.
- Fotografías oficiales.
- Dominio.

## Bloqueada intencionalmente

- Escritura administrativa persistente.
- Checkout final.
- Cobros y confirmación automática de pagos.
- Reembolsos.
- Publicaciones externas.
- Mensajes masivos.
- Descuentos extraordinarios.
- Ajustes destructivos de inventario.
