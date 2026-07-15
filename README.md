# O&K Trends — Plataforma de comercio autónomo

Plataforma digital para la tienda O&K Trends: catálogo, carrito, pedidos, inventario, clientes, fidelización, agente comercial y automatizaciones controladas.

## Estado

El desarrollo moderno se realiza en la rama:

```text
feature/autonomous-store-platform
```

La implementación HTML anterior se conserva como referencia mientras se completa la migración.

## Primer bloque implementado

- Next.js 16 y React 19.
- TypeScript estricto.
- Página pública responsive.
- Identidad visual verde esmeralda y dorado.
- Catálogo tipado por categorías.
- Búsqueda y filtros.
- Carrito persistente en el navegador.
- Separación entre datos verificados y contenido de demostración.
- Checkout deshabilitado hasta configurar pagos, contacto y entregas.
- Cabeceras HTTP básicas de seguridad.
- Pruebas unitarias.
- GitHub Actions para typecheck, lint, pruebas y build.

## Ejecución local

Requiere Node.js 24 o superior.

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Puerta de calidad

```bash
npm run check
```

Ejecuta:

1. TypeScript.
2. ESLint.
3. Pruebas unitarias.
4. Build de producción.

## Variables de entorno

Copiar `.env.example` como `.env.local` y completar únicamente los valores autorizados. Nunca subir credenciales reales al repositorio.

## Seguridad operativa

Las siguientes capacidades permanecen bloqueadas hasta configurar proveedores oficiales y superar pruebas:

- cobros;
- confirmación automática de pagos;
- mensajería masiva;
- publicación automática en redes;
- reembolsos;
- descuentos extraordinarios;
- modificación autónoma de inventario real.

## Documentación

- Auditoría inicial: `docs/audits/2026-07-15-initial-audit.md`
- Requisitos de arquitectura y módulos se incorporarán en `docs/architecture.md`.
- Migraciones de base de datos se almacenarán en `supabase/migrations/`.

## Licencia

Revisar `LICENSE` antes de publicar o distribuir versiones derivadas.
