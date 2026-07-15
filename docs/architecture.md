# Arquitectura objetivo — O&K Trends

## Principios

1. Datos comerciales verificados antes de responder o vender.
2. Acciones sensibles con aprobación humana durante las primeras etapas.
3. Módulos desacoplados mediante servicios y adaptadores.
4. Automatizaciones idempotentes, auditables y reintentables.
5. Seguridad por defecto: validación, permisos mínimos y secretos fuera del código.
6. Desarrollo incremental con pruebas y rollback.

## Capas

```text
Clientes web / móvil
        ↓
Next.js App Router
        ↓
Casos de uso y políticas
        ↓
Repositorios y adaptadores
        ↓
Supabase PostgreSQL / Storage / Auth
        ↓
Integraciones oficiales (pagos, WhatsApp, n8n, IA)
```

## Dominios

### Comercio

- Catálogo.
- Productos y variantes.
- Inventario.
- Carrito.
- Cupones.
- Checkout.
- Pedidos.
- Pagos.
- Envíos.

### Clientes

- Perfiles.
- Direcciones.
- CRM.
- Consentimientos.
- Preferencias.
- Fidelización.
- Referidos.

### Operación

- Administración.
- Roles y permisos.
- Auditoría.
- Reportes.
- Notificaciones.
- Automatizaciones.

### Inteligencia artificial

- Proveedor intercambiable.
- Agente comercial.
- Herramientas con lista permitida.
- Registro de cada llamada.
- Escalamiento humano.
- Bloqueo de acciones sensibles.

## Diseño multiempresa

Aunque la primera empresa será O&K Trends, las tablas principales incluirán `tenant_id`. Esto evita mezclar datos y permite reutilizar la plataforma comercialmente sin rediseñar la seguridad.

## Estados principales

### Producto

```text
draft → active → archived
```

### Pedido

```text
draft → pending_confirmation → confirmed → preparing → shipped → delivered
                                  ↘ cancelled
```

### Pago

```text
pending → authorized → paid → failed
                    ↘ refunded (aprobación humana)
```

### Automatización

```text
draft → enabled → paused → disabled
```

## Reglas sensibles

Requieren aprobación humana inicialmente:

- descuentos fuera de reglas;
- reembolsos;
- devoluciones;
- cambio manual de pago;
- modificación destructiva de inventario;
- publicación externa;
- mensajes masivos;
- exportación de datos personales.

## Estrategia de integraciones

Cada servicio externo implementará una interfaz propia:

```text
PaymentProvider
MessagingProvider
AiProvider
AutomationProvider
ShippingProvider
```

En desarrollo se utilizarán adaptadores simulados. Producción solo aceptará proveedores oficiales configurados con variables de entorno.

## Observabilidad

- `audit_logs`: acciones administrativas y del agente.
- `automation_runs`: ejecuciones y reintentos.
- `agent_runs`: intención, herramientas, resultado y escalamiento.
- `notification_deliveries`: entrega, error y reintento.

## Roadmap técnico

1. Base pública y catálogo local.
2. Esquema Supabase y RLS.
3. Autenticación administrativa.
4. Catálogo persistente e inventario.
5. Carrito y pedidos.
6. Panel administrativo.
7. CRM y fidelización.
8. Agente comercial conectado a datos reales.
9. Automatizaciones n8n con aprobación.
10. Pagos y mensajería oficiales.
11. Reportes y despliegue de producción.
