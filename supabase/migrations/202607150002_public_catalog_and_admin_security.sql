begin;

insert into public.permissions (code, description)
values
  ('catalog.read', 'Consultar catálogo'),
  ('catalog.write', 'Crear y modificar catálogo'),
  ('inventory.read', 'Consultar inventario'),
  ('inventory.write', 'Registrar movimientos de inventario'),
  ('orders.read', 'Consultar pedidos'),
  ('orders.write', 'Gestionar pedidos'),
  ('customers.read', 'Consultar clientes'),
  ('customers.write', 'Gestionar clientes'),
  ('settings.manage', 'Gestionar configuración de la tienda'),
  ('audit.read', 'Consultar auditoría')
on conflict (code) do update
set description = excluded.description;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.get_public_catalog(target_tenant_slug text)
returns table (
  product_id uuid,
  product_slug text,
  product_name text,
  category_slug text,
  description text,
  price_cop bigint,
  compare_at_price_cop bigint,
  available_stock integer,
  warranty_text text,
  featured boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    product.id,
    product.slug,
    product.name,
    category.slug,
    coalesce(product.short_description, product.description),
    variant.price_cop,
    variant.compare_at_price_cop,
    case
      when inventory.variant_id is null then null
      else greatest(inventory.quantity_on_hand - inventory.quantity_reserved, 0)
    end,
    product.warranty_text,
    product.featured
  from public.tenants tenant
  join public.products product
    on product.tenant_id = tenant.id
   and product.status = 'active'
  left join public.categories category
    on category.id = product.category_id
   and category.tenant_id = tenant.id
  join lateral (
    select selected_variant.*
    from public.product_variants selected_variant
    where selected_variant.product_id = product.id
      and selected_variant.tenant_id = tenant.id
      and selected_variant.is_active = true
    order by selected_variant.created_at asc, selected_variant.id asc
    limit 1
  ) variant on true
  left join public.inventory_levels inventory
    on inventory.tenant_id = tenant.id
   and inventory.variant_id = variant.id
  where tenant.slug = target_tenant_slug
    and tenant.status = 'active'
  order by product.featured desc, product.created_at desc;
$$;

revoke all on function public.get_public_catalog(text) from public;
grant execute on function public.get_public_catalog(text) to anon, authenticated;

create or replace function public.get_admin_inventory_snapshot(target_tenant_slug text)
returns table (
  variant_id uuid,
  sku text,
  product_name text,
  variant_name text,
  quantity_on_hand integer,
  quantity_reserved integer,
  available_stock integer,
  reorder_point integer,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_tenant_id uuid;
begin
  select tenant.id
  into target_tenant_id
  from public.tenants tenant
  where tenant.slug = target_tenant_slug
    and tenant.status = 'active';

  if target_tenant_id is null then
    raise exception 'Tenant not found';
  end if;

  if not public.has_permission(target_tenant_id, 'inventory.read') then
    raise exception 'Insufficient inventory permission';
  end if;

  return query
  select
    variant.id,
    variant.sku,
    product.name,
    variant.name,
    inventory.quantity_on_hand,
    inventory.quantity_reserved,
    greatest(inventory.quantity_on_hand - inventory.quantity_reserved, 0),
    inventory.reorder_point,
    inventory.updated_at
  from public.inventory_levels inventory
  join public.product_variants variant
    on variant.id = inventory.variant_id
   and variant.tenant_id = target_tenant_id
  join public.products product
    on product.id = variant.product_id
   and product.tenant_id = target_tenant_id
  where inventory.tenant_id = target_tenant_id
  order by product.name, variant.name;
end;
$$;

revoke all on function public.get_admin_inventory_snapshot(text) from public;
grant execute on function public.get_admin_inventory_snapshot(text) to authenticated;

commit;
