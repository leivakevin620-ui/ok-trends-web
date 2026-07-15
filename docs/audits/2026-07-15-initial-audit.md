# Auditoría inicial — O&K Trends

Fecha: 2026-07-15

## Alcance

Auditoría del repositorio `leivakevin620-ui/ok-trends-web` antes de iniciar la plataforma autónoma.

## Hallazgos verificados

### Estructura existente

- La rama principal contenía una implementación estática basada en HTML.
- Existe un `Index.html` en la raíz.
- Existe otra implementación en `Tienda_Relojes/Index.html`.
- La identidad visual actual usa verde esmeralda, dorado y tipografías externas.
- El HTML concentra estilos y comportamiento en archivos monolíticos.
- No existía `package.json` en la raíz.
- No existía aplicación Next.js, tipado TypeScript, suite de pruebas ni puerta de calidad automatizada.
- No existía una base de datos conectada a este repositorio.
- No existían autenticación, permisos, inventario persistente, pedidos, CRM, fidelización ni agentes conectados al catálogo.

### Riesgos

1. Duplicidad de páginas HTML y posibilidad de divergencia.
2. Datos comerciales mezclados con presentación visual.
3. Ausencia de validación centralizada.
4. Ausencia de pruebas repetibles.
5. Ausencia de separación entre catálogo verificado y contenido de demostración.
6. Checkout y mensajería sin una capa formal de permisos, auditoría e idempotencia.
7. Falta de una política de secretos y variables de entorno específica para la aplicación web.

## Decisiones aplicadas

- Conservar el trabajo existente mientras se construye la nueva plataforma en una rama aislada.
- Crear la nueva aplicación en `feature/autonomous-store-platform`.
- Adoptar Next.js, React y TypeScript estricto.
- Separar datos, componentes, utilidades, pruebas y documentación.
- No habilitar cobros, mensajería ni publicación automática sin credenciales oficiales y validaciones.
- Etiquetar productos como `verified` o `placeholder` para impedir precios inventados.
- Mantener el checkout deshabilitado hasta configurar contacto, entrega y pagos.
- Añadir una puerta de calidad con typecheck, lint, pruebas y build.

## Estado después del primer bloque

- Proyecto Next.js inicializado.
- Catálogo tipado creado.
- Página pública responsive creada.
- Búsqueda, filtros y carrito local implementados.
- Productos no verificados bloqueados para compra.
- Checkout sensible deshabilitado.
- Pruebas unitarias iniciales añadidas.
- GitHub Actions preparado para verificar el proyecto.

## Pendientes externos

- Proyecto Supabase exclusivo para O&K Trends.
- Datos legales y comerciales definitivos.
- Número oficial de WhatsApp Business.
- Proveedor de pagos autorizado para Colombia.
- Políticas de envío, cambios y devoluciones.
- Dominio y despliegue de producción.
