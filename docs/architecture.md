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

## Fuentes del catálogo

La tienda usa una interfaz de repositorio con dos modos:

```text
Supabase configurado
  → RPC get_public_catalog
  → validación Zod
  → catálogo verificado

Supabase ausente o con error
  → seed local verificado
  → aviso operativo
  → checkout sensible permanece bloqueado
```

La clave `service_role` no es necesaria para consultar el catálogo público y nunca se envía al navegador.

## Administración

El panel administrativo se encuentra bajo `/admin`.

### Etapa de arranque

Mientras no exista un proyecto Supabase exclusivo, el propietario puede acceder mediante:

- contraseña guardada solo como variable privada del servidor;
- comparación resistente a diferencias temporales;
- cookie HttpOnly firmada con HMAC SHA-256;
- `SameSite=Strict`;
- vencimiento de 8 horas;
- límite de cinco intentos por ventana de 15 minutos.

Esta etapa es de solo lectura. No permite editar catálogo ni inventario.

### Etapa de producción

El acceso temporal será reemplazado por:

- Supabase Auth;
- perfil enlazado a `auth.users`;
- membresía del tenant O&K Trends;
- roles y permisos;
- RLS;
- auditoría de cada escritura.

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

Aunque la primera empresa será O&K Trends, las tablas principales incluyen `tenant_id`. Esto evita mezclar datos y permite reutilizar la plataforma comercialmente sin rediseñar la seguridad.

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

1. Base pública y catálogo local. **Completado**.
2. Esquema Supabase y RLS. **Preparado, pendiente de proyecto exclusivo**.
3. Administración protegida de solo lectura. **Completado**.
4. Supabase Auth y catálogo persistente. **Siguiente bloque**.
5. Carrito y pedidos persistentes.
6. Panel administrativo con escrituras auditadas.
7. CRM y fidelización.
8. Agente comercial conectado a datos reales.
9. Automatizaciones n8n con aprobación.
10. Pagos y mensajería oficiales.
11. Reportes y despliegue de producción.
