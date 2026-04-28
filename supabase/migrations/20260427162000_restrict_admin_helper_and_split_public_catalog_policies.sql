create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    and public.has_role((select public.current_user_id()), 'admin'::app_role);
$$;

revoke execute on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated, service_role;

revoke execute on function public.has_role(uuid, public.app_role) from public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

drop policy if exists "Courses are viewable by eligible users" on public.courses;
create policy "Anyone can view active courses"
on public.courses
for select
to public
using (
  (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false)
  and is_active = true
);

create policy "Admins can view all courses"
on public.courses
for select
to authenticated
using (
  (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false)
  and (select public.current_user_is_admin())
);

drop policy if exists "Delivery zones are viewable by eligible users" on public.delivery_zones;
create policy "Anyone can view active delivery zones"
on public.delivery_zones
for select
to public
using (
  (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false)
  and is_active = true
);

create policy "Admins can view all delivery zones"
on public.delivery_zones
for select
to authenticated
using (
  (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false)
  and (select public.current_user_is_admin())
);

drop policy if exists "Product categories are viewable by eligible users" on public.product_categories;
create policy "Anyone can view active categories"
on public.product_categories
for select
to public
using (
  (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false)
  and is_active = true
);

create policy "Admins can view all product categories"
on public.product_categories
for select
to authenticated
using (
  (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false)
  and (select public.current_user_is_admin())
);

drop policy if exists "Products are viewable by eligible users" on public.products;
create policy "Active products are viewable by everyone"
on public.products
for select
to public
using (
  (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false)
  and is_active = true
);

create policy "Admins can view all products"
on public.products
for select
to authenticated
using (
  (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false)
  and (select public.current_user_is_admin())
);
