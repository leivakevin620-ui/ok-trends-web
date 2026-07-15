begin;

create extension if not exists pgcrypto;

create schema if not exists private;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 2 and 120),
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code text not null,
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, code)
);

create table public.permissions (
  code text primary key,
  description text not null
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_code text not null references public.permissions(code) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (role_id, permission_code)
);

create table public.tenant_memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (tenant_id, user_id)
);

create or replace function public.is_tenant_member(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships membership
    where membership.tenant_id = target_tenant_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  );
$$;

create or replace function public.has_permission(target_tenant_id uuid, target_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships membership
    join public.role_permissions role_permission
      on role_permission.role_id = membership.role_id
    where membership.tenant_id = target_tenant_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and role_permission.permission_code = target_permission
  );
$$;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  full_name text not null check (char_length(full_name) between 2 and 160),
  email text,
  phone text,
  lifecycle_stage text not null default 'lead' check (lifecycle_stage in ('lead', 'prospect', 'customer', 'vip', 'inactive')),
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  total_spent_cop bigint not null default 0 check (total_spent_cop >= 0),
  order_count integer not null default 0 check (order_count >= 0),
  last_purchase_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique nulls not distinct (tenant_id, email),
  unique nulls not distinct (tenant_id, phone)
);

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text not null default 'Principal',
  recipient_name text not null,
  recipient_phone text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  region text not null,
  country_code char(2) not null default 'CO',
  postal_code text,
  delivery_notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  parent_id uuid references public.categories(id) on delete set null,
  slug text not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, slug)
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, slug)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  slug text not null,
  name text not null check (char_length(name) between 2 and 180),
  short_description text,
  description text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  warranty_text text,
  featured boolean not null default false,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, slug)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null,
  name text not null,
  attributes jsonb not null default '{}'::jsonb,
  price_cop bigint not null check (price_cop >= 0),
  compare_at_price_cop bigint check (compare_at_price_cop is null or compare_at_price_cop >= price_cop),
  cost_cop bigint check (cost_cop is null or cost_cop >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, sku)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  storage_path text not null,
  alt_text text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.inventory_levels (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  quantity_reserved integer not null default 0 check (quantity_reserved >= 0),
  reorder_point integer not null default 0 check (reorder_point >= 0),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (tenant_id, variant_id),
  check (quantity_reserved <= quantity_on_hand)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  movement_type text not null check (movement_type in ('purchase', 'sale', 'reservation', 'release', 'adjustment', 'return')),
  quantity_delta integer not null check (quantity_delta <> 0),
  reason text not null,
  reference_type text,
  reference_id uuid,
  idempotency_key text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique nulls not distinct (tenant_id, idempotency_key)
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  anonymous_token uuid,
  status text not null default 'active' check (status in ('active', 'converted', 'abandoned', 'expired')),
  currency char(3) not null default 'COP',
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  quantity integer not null check (quantity between 1 and 20),
  unit_price_cop bigint not null check (unit_price_cop >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (cart_id, variant_id)
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code text not null,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value integer not null check (discount_value > 0),
  minimum_order_cop bigint not null default 0 check (minimum_order_cop >= 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  requires_approval boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, code),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  cart_id uuid references public.carts(id) on delete set null,
  order_number bigint generated always as identity,
  status text not null default 'draft' check (status in ('draft', 'pending_confirmation', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
  currency char(3) not null default 'COP',
  subtotal_cop bigint not null default 0 check (subtotal_cop >= 0),
  discount_cop bigint not null default 0 check (discount_cop >= 0),
  shipping_cop bigint not null default 0 check (shipping_cop >= 0),
  total_cop bigint not null default 0 check (total_cop >= 0),
  coupon_id uuid references public.coupons(id) on delete set null,
  customer_notes text,
  internal_notes text,
  shipping_address_snapshot jsonb,
  confirmed_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, order_number),
  check (total_cop = greatest(subtotal_cop - discount_cop, 0) + shipping_cop)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_name text,
  sku text,
  quantity integer not null check (quantity > 0),
  unit_price_cop bigint not null check (unit_price_cop >= 0),
  line_total_cop bigint generated always as (quantity * unit_price_cop) stored,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_reference text,
  status text not null default 'pending' check (status in ('pending', 'authorized', 'paid', 'failed', 'refunded')),
  amount_cop bigint not null check (amount_cop >= 0),
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, idempotency_key)
);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text,
  tracking_number text,
  status text not null default 'pending' check (status in ('pending', 'ready', 'in_transit', 'delivered', 'failed', 'returned')),
  estimated_delivery_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.loyalty_accounts (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  points_balance integer not null default 0 check (points_balance >= 0),
  tier text not null default 'basic' check (tier in ('basic', 'silver', 'gold', 'vip')),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (tenant_id, customer_id)
);

create table public.loyalty_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  movement_type text not null check (movement_type in ('earn', 'redeem', 'expire', 'adjustment')),
  points_delta integer not null check (points_delta <> 0),
  reason text not null,
  reference_type text,
  reference_id uuid,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  channel text not null check (channel in ('web', 'whatsapp', 'instagram', 'facebook', 'email')),
  status text not null default 'open' check (status in ('open', 'waiting_customer', 'waiting_human', 'closed')),
  assigned_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_type text not null check (sender_type in ('customer', 'agent', 'human', 'system')),
  body text not null check (char_length(body) between 1 and 10000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  source text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),
  interest_summary text,
  next_follow_up_at timestamptz,
  assigned_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.automations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code text not null,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'enabled', 'paused', 'disabled')),
  trigger_type text not null,
  configuration jsonb not null default '{}'::jsonb,
  requires_approval boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, code)
);

create table public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  automation_id uuid not null references public.automations(id) on delete cascade,
  status text not null check (status in ('queued', 'running', 'waiting_approval', 'succeeded', 'failed', 'cancelled')),
  idempotency_key text not null,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error_code text,
  error_message text,
  attempt integer not null default 1 check (attempt > 0),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, idempotency_key)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  channel text not null check (channel in ('web', 'whatsapp', 'email', 'sms')),
  template_code text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'failed', 'cancelled')),
  consent_verified boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  provider_reference text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  tenant_id uuid references public.tenants(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_type text not null check (actor_type in ('user', 'agent', 'automation', 'system')),
  action text not null,
  entity_type text not null,
  entity_id text,
  request_id uuid,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index customers_tenant_stage_idx on public.customers (tenant_id, lifecycle_stage);
create index customers_tenant_last_purchase_idx on public.customers (tenant_id, last_purchase_at desc);
create index products_tenant_status_idx on public.products (tenant_id, status);
create index products_tenant_category_idx on public.products (tenant_id, category_id);
create index variants_product_idx on public.product_variants (product_id);
create index inventory_low_stock_idx on public.inventory_levels (tenant_id, quantity_on_hand, reorder_point);
create index carts_tenant_status_idx on public.carts (tenant_id, status, updated_at desc);
create index orders_tenant_status_idx on public.orders (tenant_id, status, created_at desc);
create index orders_customer_idx on public.orders (customer_id, created_at desc);
create index payments_order_idx on public.payments (order_id, status);
create index conversations_customer_idx on public.conversations (customer_id, updated_at desc);
create index leads_follow_up_idx on public.leads (tenant_id, status, next_follow_up_at);
create index automation_runs_status_idx on public.automation_runs (tenant_id, status, created_at desc);
create index notifications_status_idx on public.notifications (tenant_id, status, scheduled_at);
create index audit_logs_lookup_idx on public.audit_logs (tenant_id, entity_type, entity_id, created_at desc);

create trigger tenants_set_updated_at before update on public.tenants for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger memberships_set_updated_at before update on public.tenant_memberships for each row execute function public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger addresses_set_updated_at before update on public.customer_addresses for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger brands_set_updated_at before update on public.brands for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger variants_set_updated_at before update on public.product_variants for each row execute function public.set_updated_at();
create trigger cart_set_updated_at before update on public.carts for each row execute function public.set_updated_at();
create trigger cart_items_set_updated_at before update on public.cart_items for each row execute function public.set_updated_at();
create trigger coupons_set_updated_at before update on public.coupons for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger shipments_set_updated_at before update on public.shipments for each row execute function public.set_updated_at();
create trigger conversations_set_updated_at before update on public.conversations for each row execute function public.set_updated_at();
create trigger leads_set_updated_at before update on public.leads for each row execute function public.set_updated_at();
create trigger automations_set_updated_at before update on public.automations for each row execute function public.set_updated_at();

insert into public.permissions (code, description) values
  ('catalog.read', 'View catalog'),
  ('catalog.write', 'Manage products, categories and brands'),
  ('inventory.read', 'View inventory'),
  ('inventory.write', 'Adjust inventory'),
  ('orders.read', 'View orders'),
  ('orders.write', 'Manage order status'),
  ('customers.read', 'View customer records'),
  ('customers.write', 'Manage CRM records'),
  ('marketing.write', 'Manage campaigns and coupons'),
  ('automations.manage', 'Manage automation definitions'),
  ('reports.read', 'View business reports'),
  ('audit.read', 'View audit logs'),
  ('settings.manage', 'Manage tenant settings')
on conflict (code) do nothing;

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory_levels enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.shipments enable row level security;
alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_movements enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.leads enable row level security;
alter table public.automations enable row level security;
alter table public.automation_runs enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_read_self on public.profiles for select using (id = auth.uid());
create policy profiles_update_self on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy permissions_read_authenticated on public.permissions for select to authenticated using (true);

create policy tenant_member_read on public.tenants for select using (public.is_tenant_member(id));
create policy memberships_read_own on public.tenant_memberships for select using (user_id = auth.uid());

create policy categories_public_read on public.categories for select using (is_active = true);
create policy brands_public_read on public.brands for select using (is_active = true);
create policy products_public_read on public.products for select using (status = 'active');
create policy variants_public_read on public.product_variants for select using (is_active = true);
create policy images_public_read on public.product_images for select using (true);

create policy categories_staff_all on public.categories for all using (public.has_permission(tenant_id, 'catalog.write')) with check (public.has_permission(tenant_id, 'catalog.write'));
create policy brands_staff_all on public.brands for all using (public.has_permission(tenant_id, 'catalog.write')) with check (public.has_permission(tenant_id, 'catalog.write'));
create policy products_staff_all on public.products for all using (public.has_permission(tenant_id, 'catalog.write')) with check (public.has_permission(tenant_id, 'catalog.write'));
create policy variants_staff_all on public.product_variants for all using (public.has_permission(tenant_id, 'catalog.write')) with check (public.has_permission(tenant_id, 'catalog.write'));
create policy images_staff_all on public.product_images for all using (public.has_permission(tenant_id, 'catalog.write')) with check (public.has_permission(tenant_id, 'catalog.write'));

create policy inventory_staff_read on public.inventory_levels for select using (public.has_permission(tenant_id, 'inventory.read'));
create policy inventory_staff_write on public.inventory_levels for all using (public.has_permission(tenant_id, 'inventory.write')) with check (public.has_permission(tenant_id, 'inventory.write'));
create policy inventory_movements_staff_read on public.inventory_movements for select using (public.has_permission(tenant_id, 'inventory.read'));
create policy inventory_movements_staff_write on public.inventory_movements for insert with check (public.has_permission(tenant_id, 'inventory.write'));

create policy customers_staff_read on public.customers for select using (public.has_permission(tenant_id, 'customers.read'));
create policy customers_staff_write on public.customers for all using (public.has_permission(tenant_id, 'customers.write')) with check (public.has_permission(tenant_id, 'customers.write'));
create policy addresses_staff_all on public.customer_addresses for all using (public.has_permission(tenant_id, 'customers.write')) with check (public.has_permission(tenant_id, 'customers.write'));

create policy orders_staff_read on public.orders for select using (public.has_permission(tenant_id, 'orders.read'));
create policy orders_staff_write on public.orders for all using (public.has_permission(tenant_id, 'orders.write')) with check (public.has_permission(tenant_id, 'orders.write'));
create policy order_items_staff_read on public.order_items for select using (public.has_permission(tenant_id, 'orders.read'));
create policy order_items_staff_write on public.order_items for all using (public.has_permission(tenant_id, 'orders.write')) with check (public.has_permission(tenant_id, 'orders.write'));
create policy payments_staff_read on public.payments for select using (public.has_permission(tenant_id, 'orders.read'));
create policy payments_staff_write on public.payments for all using (public.has_permission(tenant_id, 'orders.write')) with check (public.has_permission(tenant_id, 'orders.write'));
create policy shipments_staff_all on public.shipments for all using (public.has_permission(tenant_id, 'orders.write')) with check (public.has_permission(tenant_id, 'orders.write'));

create policy coupons_staff_all on public.coupons for all using (public.has_permission(tenant_id, 'marketing.write')) with check (public.has_permission(tenant_id, 'marketing.write'));
create policy loyalty_staff_read on public.loyalty_accounts for select using (public.has_permission(tenant_id, 'customers.read'));
create policy loyalty_movements_staff_read on public.loyalty_movements for select using (public.has_permission(tenant_id, 'customers.read'));
create policy loyalty_movements_staff_write on public.loyalty_movements for insert with check (public.has_permission(tenant_id, 'customers.write'));

create policy conversations_staff_read on public.conversations for select using (public.has_permission(tenant_id, 'customers.read'));
create policy conversations_staff_write on public.conversations for all using (public.has_permission(tenant_id, 'customers.write')) with check (public.has_permission(tenant_id, 'customers.write'));
create policy messages_staff_read on public.messages for select using (public.has_permission(tenant_id, 'customers.read'));
create policy messages_staff_write on public.messages for insert with check (public.has_permission(tenant_id, 'customers.write'));
create policy leads_staff_all on public.leads for all using (public.has_permission(tenant_id, 'customers.write')) with check (public.has_permission(tenant_id, 'customers.write'));

create policy automations_staff_all on public.automations for all using (public.has_permission(tenant_id, 'automations.manage')) with check (public.has_permission(tenant_id, 'automations.manage'));
create policy automation_runs_staff_read on public.automation_runs for select using (public.has_permission(tenant_id, 'automations.manage'));
create policy notifications_staff_read on public.notifications for select using (public.has_permission(tenant_id, 'customers.read'));
create policy audit_staff_read on public.audit_logs for select using (public.has_permission(tenant_id, 'audit.read'));

commit;
