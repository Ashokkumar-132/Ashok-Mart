-- ROLES ------------------------------------------------------------------
create type public.app_role as enum ('customer', 'seller');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  role public.app_role not null,
  created_at timestamptz not null default now()
);
grant select, insert on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create policy "read own role" on public.user_roles
  for select to authenticated using (user_id = auth.uid());
create policy "insert own role" on public.user_roles
  for insert to authenticated with check (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- PROFILES ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key,
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "insert own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ADDRESSES --------------------------------------------------------------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  full_name text not null,
  house_number text not null,
  street text not null,
  area text not null default '',
  city text not null,
  state text not null,
  pincode text not null,
  phone text not null,
  is_default boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.addresses to authenticated;
grant all on public.addresses to service_role;
alter table public.addresses enable row level security;

create policy "own addresses" on public.addresses
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- PRODUCTS ---------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid,
  name text not null,
  category text not null,
  brand text not null default '',
  description text not null default '',
  image text not null default '',
  mrp numeric(10,2) not null check (mrp >= 0),
  price numeric(10,2) not null check (price >= 0),
  discount integer not null default 0,
  stock integer not null default 0 check (stock >= 0),
  specifications text not null default '',
  rating numeric(2,1) not null default 4.2,
  reviews integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;

create policy "products are public" on public.products
  for select using (true);
create policy "sellers insert own products" on public.products
  for insert to authenticated
  with check (public.has_role(auth.uid(), 'seller') and seller_id = auth.uid());
create policy "sellers update own or demo products" on public.products
  for update to authenticated
  using (public.has_role(auth.uid(), 'seller') and (seller_id = auth.uid() or seller_id is null))
  with check (public.has_role(auth.uid(), 'seller'));
create policy "sellers delete own or demo products" on public.products
  for delete to authenticated
  using (public.has_role(auth.uid(), 'seller') and (seller_id = auth.uid() or seller_id is null));

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger products_touch before update on public.products
for each row execute function public.touch_updated_at();

-- CART -------------------------------------------------------------------
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
grant select, insert, update, delete on public.cart_items to authenticated;
grant all on public.cart_items to service_role;
alter table public.cart_items enable row level security;

create policy "own cart" on public.cart_items
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ORDERS -----------------------------------------------------------------
create sequence public.order_no_seq start 10001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique default ('AM' || nextval('public.order_no_seq')::text),
  user_id uuid not null,
  address_id uuid references public.addresses(id) on delete set null,
  address_snapshot jsonb not null default '{}'::jsonb,
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  delivery_charge numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  payment_method text not null default 'COD',
  status text not null default 'Ordered',
  created_at timestamptz not null default now()
);
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  seller_id uuid,
  name text not null,
  image text not null default '',
  quantity integer not null,
  price numeric(10,2) not null,
  mrp numeric(10,2) not null default 0
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;

create policy "customers read own orders" on public.orders
  for select to authenticated using (user_id = auth.uid());
create policy "sellers read all orders" on public.orders
  for select to authenticated using (public.has_role(auth.uid(), 'seller'));
create policy "sellers update order status" on public.orders
  for update to authenticated using (public.has_role(auth.uid(), 'seller'))
  with check (public.has_role(auth.uid(), 'seller'));

create policy "read own order items" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
    or public.has_role(auth.uid(), 'seller')
  );

-- PLACE ORDER (server-side pricing + stock) --------------------------------
create or replace function public.place_order(p_address_id uuid, p_payment_method text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_order uuid;
  v_subtotal numeric(10,2) := 0;
  v_mrp_total numeric(10,2) := 0;
  v_delivery numeric(10,2) := 0;
  r record;
  v_addr public.addresses%rowtype;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;

  select * into v_addr from public.addresses where id = p_address_id and user_id = v_user;
  if not found then raise exception 'Invalid delivery address'; end if;

  if not exists (select 1 from public.cart_items where user_id = v_user) then
    raise exception 'Cart is empty';
  end if;

  for r in
    select c.quantity, p.id, p.name, p.image, p.price, p.mrp, p.stock, p.seller_id
    from public.cart_items c join public.products p on p.id = c.product_id
    where c.user_id = v_user
    for update of p
  loop
    if r.quantity > r.stock then
      raise exception 'Insufficient stock for %', r.name;
    end if;
    v_subtotal := v_subtotal + (r.price * r.quantity);
    v_mrp_total := v_mrp_total + (r.mrp * r.quantity);
  end loop;

  if v_subtotal < 500 then v_delivery := 49; end if;

  insert into public.orders (user_id, address_id, address_snapshot, subtotal, discount, delivery_charge, total_amount, payment_method, status)
  values (
    v_user, p_address_id,
    jsonb_build_object('full_name', v_addr.full_name, 'house_number', v_addr.house_number,
      'street', v_addr.street, 'area', v_addr.area, 'city', v_addr.city,
      'state', v_addr.state, 'pincode', v_addr.pincode, 'phone', v_addr.phone),
    v_mrp_total, v_mrp_total - v_subtotal, v_delivery, v_subtotal + v_delivery,
    coalesce(p_payment_method, 'COD'), 'Ordered'
  ) returning id into v_order;

  insert into public.order_items (order_id, product_id, seller_id, name, image, quantity, price, mrp)
  select v_order, p.id, p.seller_id, p.name, p.image, c.quantity, p.price, p.mrp
  from public.cart_items c join public.products p on p.id = c.product_id
  where c.user_id = v_user;

  update public.products p set stock = p.stock - c.quantity
  from public.cart_items c where c.product_id = p.id and c.user_id = v_user;

  delete from public.cart_items where user_id = v_user;

  return v_order;
end $$;

grant execute on function public.place_order(uuid, text) to authenticated;