begin;

insert into public.tenants (id, slug, name)
values ('00000000-0000-0000-0000-000000000001', 'o-k-trends', 'O&K Trends')
on conflict (id) do update set name = excluded.name;

insert into public.roles (id, tenant_id, code, name, is_system)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner', 'Propietario', true),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'sales', 'Ventas', true),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'inventory', 'Inventario', true)
on conflict (tenant_id, code) do nothing;

insert into public.role_permissions (role_id, permission_code)
select '10000000-0000-0000-0000-000000000001'::uuid, permission.code
from public.permissions permission
on conflict do nothing;

insert into public.role_permissions (role_id, permission_code)
values
  ('10000000-0000-0000-0000-000000000002', 'catalog.read'),
  ('10000000-0000-0000-0000-000000000002', 'inventory.read'),
  ('10000000-0000-0000-0000-000000000002', 'orders.read'),
  ('10000000-0000-0000-0000-000000000002', 'orders.write'),
  ('10000000-0000-0000-0000-000000000002', 'customers.read'),
  ('10000000-0000-0000-0000-000000000002', 'customers.write'),
  ('10000000-0000-0000-0000-000000000003', 'catalog.read'),
  ('10000000-0000-0000-0000-000000000003', 'inventory.read'),
  ('10000000-0000-0000-0000-000000000003', 'inventory.write')
on conflict do nothing;

insert into public.categories (id, tenant_id, slug, name, sort_order)
values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'relojes', 'Relojes', 10),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'perfumes', 'Perfumes', 20),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'ropa', 'Ropa', 30),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'gorras', 'Gorras', 40),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'zapatos', 'Zapatos', 50),
  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'accesorios', 'Accesorios', 60)
on conflict (tenant_id, slug) do nothing;

insert into public.products (
  id,
  tenant_id,
  category_id,
  slug,
  name,
  short_description,
  description,
  status,
  warranty_text,
  featured
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'richard-mille-negro',
    'Reloj Richard Mille negro',
    'Reloj análogo para caballero con pulso en silicona y fecha.',
    'Referencia comercial verificada para el catálogo inicial de O&K Trends.',
    'active',
    '3 meses por maquinaria y batería',
    true
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'technomarine-caballero',
    'Reloj Technomarine caballero',
    'Hora análoga, fecha, pulso en silicona e incluye estuche.',
    'Referencia comercial verificada para el catálogo inicial de O&K Trends.',
    'active',
    '3 meses por maquinaria y batería',
    true
  )
on conflict (tenant_id, slug) do update
set
  name = excluded.name,
  short_description = excluded.short_description,
  description = excluded.description,
  status = excluded.status,
  warranty_text = excluded.warranty_text,
  featured = excluded.featured;

insert into public.product_variants (
  id,
  tenant_id,
  product_id,
  sku,
  name,
  attributes,
  price_cop
)
values
  (
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'OK-RM-BLACK-001',
    'Negro',
    '{"color":"Negro","pulso":"Silicona"}'::jsonb,
    89900
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    'OK-TM-MEN-001',
    'Caballero',
    '{"publico":"Caballero","pulso":"Silicona","incluyeEstuche":true}'::jsonb,
    120000
  )
on conflict (tenant_id, sku) do update
set
  name = excluded.name,
  attributes = excluded.attributes,
  price_cop = excluded.price_cop,
  is_active = true;

insert into public.inventory_levels (tenant_id, variant_id, quantity_on_hand, reorder_point)
values
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 4, 2),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 0, 2)
on conflict (tenant_id, variant_id) do update
set
  quantity_on_hand = excluded.quantity_on_hand,
  reorder_point = excluded.reorder_point,
  updated_at = timezone('utc', now());

commit;
