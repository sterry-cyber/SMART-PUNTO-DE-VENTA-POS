-- ============================================================================
-- SMART PUNTO DE VENTA v1.9.8 (REACT + SUPABASE) - ESQUEMA DE PRODUCCIÓN
-- Proyecto: https://myrfuddxhyavadzbmarl.supabase.co
-- Ejecuta este script en el SQL Editor de tu panel de Supabase.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- LIMPIAR TABLAS ANTERIORES (SI TENÍAN ID TIPO UUID O DATOS DEMO)
drop table if exists public.pos_users cascade;
drop table if exists public.cash_closings cascade;
drop table if exists public.expenses cascade;
drop table if exists public.payroll_movements cascade;
drop table if exists public.employees cascade;
drop table if exists public.product_audits cascade;
drop table if exists public.account_movements cascade;
drop table if exists public.orders cascade;
drop table if exists public.transfers cascade;
drop table if exists public.quotes cascade;
drop table if exists public.purchases cascade;
drop table if exists public.sales cascade;
drop table if exists public.products cascade;
drop table if exists public.clients cascade;
drop table if exists public.suppliers cascade;
drop table if exists public.companies cascade;

-- 1. EMPRESAS Y SUCURSALES
create table if not exists public.companies (
  id text primary key,
  name text not null,
  commercial_name text not null,
  tax_id text not null default '',
  phone text default '',
  email text default '',
  address text default '',
  city text default '',
  currency_symbol text default 'L',
  currency_code text default 'NIO',
  is_primary boolean default false,
  branch_code text not null default 'ABARROTERÍA',
  image_url text default '',
  created_at timestamptz default now()
);

-- 2. PROVEEDORES
create table if not exists public.suppliers (
  id text primary key,
  code text not null,
  name text not null,
  contact_name text default '',
  tax_id text default '',
  phone text default '',
  email text default '',
  address text default '',
  credit_limit numeric(12,2) default 0,
  current_balance numeric(12,2) default 0,
  credit_days integer default 0,
  enabled boolean default true,
  logo_optimized boolean default true,
  created_at timestamptz default now()
);

-- 3. CLIENTES
create table if not exists public.clients (
  id text primary key,
  code text not null,
  name text not null,
  tax_id text default '',
  phone text default '',
  email text default '',
  address text default '',
  credit_limit numeric(12,2) default 0,
  current_balance numeric(12,2) default 0,
  credit_days integer default 0,
  price_tier text default 'DETALLE',
  enabled boolean default true,
  avatar_optimized boolean default true,
  image_url text default '',
  created_at timestamptz default now()
);

-- 4. PRODUCTOS
create table if not exists public.products (
  id text primary key,
  code text not null,
  barcode text default '',
  name text not null,
  category text not null default 'GENERAL',
  brand text default 'GENERAL',
  unit text default 'UNIDAD',
  cost numeric(12,4) not null default 0,
  price numeric(12,2) not null default 0,
  wholesale_price numeric(12,2) not null default 0,
  tax_rate numeric(5,2) default 15,
  stock numeric(12,2) default 0,
  min_stock numeric(12,2) default 5,
  max_stock numeric(12,2) default 100,
  expiration_date text,
  supplier_id text default '',
  supplier_name text default '',
  active boolean default true,
  location text default 'GENERAL',
  image_url text default '',
  branch_stocks jsonb default '[]'::jsonb,
  history jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 5. VENTAS Y PREVENTAS
create table if not exists public.sales (
  id text primary key,
  invoice_number text not null,
  date text not null,
  client_id text default '',
  client_name text not null,
  seller_name text not null,
  mode text not null default 'ESTANDAR',
  payment_type text not null default 'CONTADO',
  status text not null default 'COMPLETADA',
  due_date text,
  subtotal numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  notes text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 6. COMPRAS
create table if not exists public.purchases (
  id text primary key,
  document_number text not null,
  supplier_invoice text default '',
  date text not null,
  supplier_id text default '',
  supplier_name text not null,
  payment_type text not null default 'CONTADO',
  status text not null default 'FINALIZADA',
  due_date text,
  subtotal numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  notes text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 7. COTIZACIONES
create table if not exists public.quotes (
  id text primary key,
  quote_number text not null,
  date text not null,
  valid_until text,
  client_id text default '',
  client_name text not null,
  status text default 'ACTIVA',
  subtotal numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 8. TRASLADOS ENTRE SUCURSALES
create table if not exists public.transfers (
  id text primary key,
  transfer_number text not null,
  date text not null,
  origin_branch text not null,
  destination_branch text not null,
  status text default 'EN_TRANSITO',
  created_by text,
  notes text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 9. PEDIDOS A PROVEEDORES
create table if not exists public.orders (
  id text primary key,
  order_number text not null,
  date text not null,
  expected_date text,
  supplier_id text default '',
  supplier_name text not null,
  status text default 'PENDIENTE',
  total_estimated numeric(12,2) default 0,
  notes text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 10. MOVIMIENTOS DE CUENTAS POR COBRAR / PAGAR
create table if not exists public.account_movements (
  id text primary key,
  account_type text not null,
  entity_id text not null,
  entity_name text not null,
  document_id text,
  document_number text,
  date text not null,
  movement_type text not null,
  payment_method text not null,
  check_number text,
  bank_name text,
  check_status text,
  amount numeric(12,2) not null default 0,
  reference text,
  notes text,
  created_at timestamptz default now()
);

-- 11. AUDITORÍAS DE PRODUCTOS
create table if not exists public.product_audits (
  id text primary key,
  audit_number text not null,
  date text not null,
  branch_name text not null,
  responsible text not null,
  status text default 'EN_PROCESO',
  notes text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 12. EMPLEADOS Y PLANILLAS
create table if not exists public.employees (
  id text primary key,
  code text not null,
  full_name text not null,
  document_id text default '',
  position text default '',
  department text default '',
  base_salary numeric(12,2) default 0,
  hire_date text default '',
  phone text default '',
  email text default '',
  enabled boolean default true,
  sort_order integer default 1,
  created_at timestamptz default now()
);

create table if not exists public.payroll_movements (
  id text primary key,
  employee_id text,
  employee_name text not null,
  period text not null,
  date text not null,
  type text not null,
  concept text not null,
  amount numeric(12,2) not null default 0,
  is_deduction boolean default false,
  created_at timestamptz default now()
);

-- 13. GASTOS Y DIARIO DIGITAL (CIERRE DE CAJA)
create table if not exists public.expenses (
  id text primary key,
  date text not null,
  book_name text not null,
  category text not null,
  operation_type text not null,
  description text not null,
  reference text,
  payment_method text not null,
  amount numeric(12,2) not null default 0,
  registered_by text,
  created_at timestamptz default now()
);

create table if not exists public.cash_closings (
  id text primary key,
  date text not null,
  shift text not null,
  cashier text not null,
  opening_balance numeric(12,2) default 0,
  cash_sales numeric(12,2) default 0,
  card_sales numeric(12,2) default 0,
  transfer_sales numeric(12,2) default 0,
  credit_collections numeric(12,2) default 0,
  expenses_out numeric(12,2) default 0,
  expected_cash numeric(12,2) default 0,
  counted_cash numeric(12,2) default 0,
  difference numeric(12,2) default 0,
  status text default 'CERRADO',
  notes text,
  created_at timestamptz default now()
);

-- 14. USUARIOS Y PERMISOS DEL POS
create table if not exists public.pos_users (
  id text primary key,
  username text unique not null,
  full_name text not null,
  role text not null default 'ADMINISTRADOR',
  branch text not null default 'ABARROTERÍA',
  active boolean default true,
  pin text not null default '1234',
  permissions jsonb default '["ALL"]'::jsonb,
  created_at timestamptz default now()
);

-- HABILITAR ACCESO PARA EL CLIENTE DEL POS
alter table public.companies enable row level security;
alter table public.suppliers enable row level security;
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.purchases enable row level security;
alter table public.quotes enable row level security;
alter table public.transfers enable row level security;
alter table public.orders enable row level security;
alter table public.account_movements enable row level security;
alter table public.product_audits enable row level security;
alter table public.employees enable row level security;
alter table public.payroll_movements enable row level security;
alter table public.expenses enable row level security;
alter table public.cash_closings enable row level security;
alter table public.pos_users enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'companies','suppliers','clients','products','sales','purchases',
    'quotes','transfers','orders','account_movements','product_audits',
    'employees','payroll_movements','expenses','cash_closings','pos_users'
  ]
  loop
    execute format('drop policy if exists "pos_anon_all_%I" on public.%I', t, t);
    execute format('create policy "pos_anon_all_%I" on public.%I for all to anon, authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- REGISTROS BASE OBLIGATORIOS DEL SISTEMA (SIN DATOS DEMO)
insert into public.companies (id, name, commercial_name, tax_id, phone, email, address, city, currency_symbol, currency_code, is_primary, branch_code)
values ('comp-1', 'SMART PUNTO DE VENTA', 'SOFTWARE DE FACTURACIÓN Y CONTROL DE INVENTARIO', '00000000000000', '0000-0000', 'SMARTPUNTODEVENTA@GMAIL.COM', 'B. BELLA VISTA', 'NICARAGUA', 'C$', 'NIO', true, 'ABARROTERÍA')
on conflict (id) do nothing;

insert into public.clients (id, code, name, tax_id, phone, email, address, credit_limit, current_balance, credit_days, price_tier, enabled, avatar_optimized)
values ('cli-0', '0', 'CONSUMIDOR FINAL', '', '', '', '', 0, 0, 0, 'DETALLE', true, true)
on conflict (id) do nothing;

insert into public.pos_users (id, username, full_name, role, branch, active, pin, permissions)
values
  ('usr-1', 'ADMINISTRADOR', 'ADMINISTRADOR GENERAL', 'ADMINISTRADOR', 'ABARROTERÍA', true, '1234', '["ALL"]'::jsonb),
  ('usr-2', 'CAJERO', 'OPERADOR DE CAJA Y VENTAS', 'CAJERO', 'ABARROTERÍA', true, '1234', '["VENTAS","CLIENTES","COTIZACIONES","CUENTAS_COBRAR","DIARIO"]'::jsonb),
  ('usr-3', 'INVENTARIO', 'ENCARGADO DE BODEGA E INVENTARIO', 'INVENTARIO', 'ABARROTERÍA', true, '1234', '["PRODUCTOS","COMPRAS","TRASLADOS","PEDIDOS","PROVEEDORES","AUDITORIA"]'::jsonb),
  ('usr-4', 'CONTABILIDAD', 'CONTADOR Y FINANZAS', 'CONTABILIDAD', 'ABARROTERÍA', true, '1234', '["REPORTES","CUENTAS_COBRAR","CUENTAS_PAGAR","DIARIO","GASTOS","PLANILLAS","EMPLEADOS","VENTAS","COMPRAS","CLIENTES","PROVEEDORES"]'::jsonb)
on conflict (id) do nothing;

-- =====================================================================================
-- 15. SUPABASE STORAGE: BUCKETS Y POLÍTICAS RLS PARA SUBIR IMÁGENES
-- Buckets incluidos:
--   1. 'productos' -> Imágenes de productos y catálogo táctil
--   2. 'clientes'  -> Fotografías de clientes y avatares
--   3. 'empresa'   -> Logos de empresa y sucursales
--   4. 'pos-images'-> Bucket general de imágenes del sistema
-- =====================================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('productos', 'productos', true, 5242880, array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']),
  ('clientes', 'clientes', true, 5242880, array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']),
  ('empresa', 'empresa', true, 5242880, array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']),
  ('pos-images', 'pos-images', true, 5242880, array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Limpiar políticas previas si existen
drop policy if exists "pos_storage_public_select" on storage.objects;
drop policy if exists "pos_storage_anon_insert" on storage.objects;
drop policy if exists "pos_storage_anon_update" on storage.objects;
drop policy if exists "pos_storage_anon_delete" on storage.objects;

-- 1. Política de LECTURA PÚBLICA (SELECT) para ver las imágenes en el POS
create policy "pos_storage_public_select"
on storage.objects for select
to public
using (bucket_id in ('productos', 'clientes', 'empresa', 'pos-images'));

-- 2. Política de SUBIDA (INSERT) para subir imágenes desde el POS (anon y authenticated)
create policy "pos_storage_anon_insert"
on storage.objects for insert
to anon, authenticated
with check (bucket_id in ('productos', 'clientes', 'empresa', 'pos-images'));

-- 3. Política de ACTUALIZACIÓN (UPDATE) para reemplazar imágenes existentes
create policy "pos_storage_anon_update"
on storage.objects for update
to anon, authenticated
using (bucket_id in ('productos', 'clientes', 'empresa', 'pos-images'))
with check (bucket_id in ('productos', 'clientes', 'empresa', 'pos-images'));

-- 4. Política de ELIMINACIÓN (DELETE) para borrar imágenes desde el POS
create policy "pos_storage_anon_delete"
on storage.objects for delete
to anon, authenticated
using (bucket_id in ('productos', 'clientes', 'empresa', 'pos-images'));
