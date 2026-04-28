create or replace function public.current_user_id()
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select (select auth.uid());
$$;

create or replace function public.is_non_anonymous_session()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false;
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select
    (select public.is_non_anonymous_session())
    and public.has_role((select public.current_user_id()), 'admin'::app_role);
$$;

grant execute on function public.current_user_id() to public;
grant execute on function public.is_non_anonymous_session() to public;
grant execute on function public.current_user_is_admin() to public;

drop policy if exists "Admins can manage settings" on public.admin_settings;
create policy "Admins can manage settings"
on public.admin_settings
for all
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

drop policy if exists "Admins can manage contact messages" on public.contact_messages;
create policy "Admins can read contact messages"
on public.contact_messages
for select
to authenticated
using ((select public.current_user_is_admin()));

create policy "Admins can update contact messages"
on public.contact_messages
for update
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

create policy "Admins can delete contact messages"
on public.contact_messages
for delete
to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Admins can manage coupons" on public.coupons;
drop policy if exists "Authenticated users can read active coupons" on public.coupons;
create policy "Coupons can be read by eligible users"
on public.coupons
for select
to authenticated
using (
  (select public.current_user_is_admin())
  or (
    (select public.is_non_anonymous_session())
    and is_active = true
    and (starts_at is null or starts_at <= now())
    and (expires_at is null or expires_at > now())
  )
);

create policy "Admins can insert coupons"
on public.coupons
for insert
to authenticated
with check ((select public.current_user_is_admin()));

create policy "Admins can update coupons"
on public.coupons
for update
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

create policy "Admins can delete coupons"
on public.coupons
for delete
to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Admins manage batches" on public.course_batches;
drop policy if exists "Anyone can view batches" on public.course_batches;
create policy "Batches are viewable by eligible users"
on public.course_batches
for select
to public
using ((select public.is_non_anonymous_session()));

create policy "Admins can insert batches"
on public.course_batches
for insert
to authenticated
with check ((select public.current_user_is_admin()));

create policy "Admins can update batches"
on public.course_batches
for update
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

create policy "Admins can delete batches"
on public.course_batches
for delete
to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Admins manage courses" on public.courses;
drop policy if exists "Anyone can view active courses" on public.courses;
create policy "Courses are viewable by eligible users"
on public.courses
for select
to public
using (
  (select public.current_user_is_admin())
  or (
    is_active = true
    and (select public.is_non_anonymous_session())
  )
);

create policy "Admins can insert courses"
on public.courses
for insert
to authenticated
with check ((select public.current_user_is_admin()));

create policy "Admins can update courses"
on public.courses
for update
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

create policy "Admins can delete courses"
on public.courses
for delete
to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Admins can manage delivery zones" on public.delivery_zones;
drop policy if exists "Anyone can view active delivery zones" on public.delivery_zones;
create policy "Delivery zones are viewable by eligible users"
on public.delivery_zones
for select
to public
using (
  (select public.current_user_is_admin())
  or (
    is_active = true
    and (select public.is_non_anonymous_session())
  )
);

create policy "Admins can insert delivery zones"
on public.delivery_zones
for insert
to authenticated
with check ((select public.current_user_is_admin()));

create policy "Admins can update delivery zones"
on public.delivery_zones
for update
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

create policy "Admins can delete delivery zones"
on public.delivery_zones
for delete
to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Admins manage enrollments" on public.enrollments;
drop policy if exists "Users can delete own enrollments" on public.enrollments;
drop policy if exists "Users can enroll themselves" on public.enrollments;
drop policy if exists "Users can view own enrollments" on public.enrollments;
drop policy if exists "Users can update own enrollments" on public.enrollments;
create policy "Enrollments are viewable by owners or admins"
on public.enrollments
for select
to authenticated
using (
  (select public.current_user_is_admin())
  or (
    (select public.is_non_anonymous_session())
    and user_id = (select public.current_user_id())
  )
);

create policy "Enrollments can be created by owners or admins"
on public.enrollments
for insert
to authenticated
with check (
  (select public.current_user_is_admin())
  or (
    (select public.is_non_anonymous_session())
    and user_id = (select public.current_user_id())
  )
);

create policy "Enrollments can be updated by owners or admins"
on public.enrollments
for update
to authenticated
using (
  (select public.current_user_is_admin())
  or (
    (select public.is_non_anonymous_session())
    and user_id = (select public.current_user_id())
  )
)
with check (
  (select public.current_user_is_admin())
  or (
    (select public.is_non_anonymous_session())
    and user_id = (select public.current_user_id())
  )
);

create policy "Enrollments can be deleted by owners or admins"
on public.enrollments
for delete
to authenticated
using (
  (select public.current_user_is_admin())
  or (
    (select public.is_non_anonymous_session())
    and user_id = (select public.current_user_id())
  )
);

drop policy if exists "Admins manage incomplete orders" on public.incomplete_orders;
drop policy if exists "Users can delete own incomplete orders" on public.incomplete_orders;
drop policy if exists "Users can insert own incomplete orders" on public.incomplete_orders;
drop policy if exists "Users can view own incomplete orders" on public.incomplete_orders;
drop policy if exists "Users can update own incomplete orders" on public.incomplete_orders;
create policy "Incomplete orders are viewable by owners or admins"
on public.incomplete_orders
for select
to authenticated
using (
  (select public.current_user_is_admin())
  or (
    (select public.is_non_anonymous_session())
    and user_id = (select public.current_user_id())
  )
);

create policy "Incomplete orders can be created by owners or admins"
on public.incomplete_orders
for insert
to authenticated
with check (
  (select public.current_user_is_admin())
  or (
    (select public.is_non_anonymous_session())
    and user_id = (select public.current_user_id())
  )
);

create policy "Incomplete orders can be updated by owners or admins"
on public.incomplete_orders
for update
to authenticated
using (
  (select public.current_user_is_admin())
  or (
    (select public.is_non_anonymous_session())
    and user_id = (select public.current_user_id())
  )
)
with check (
  (select public.current_user_is_admin())
  or (
    (select public.is_non_anonymous_session())
    and user_id = (select public.current_user_id())
  )
);

create policy "Incomplete orders can be deleted by owners or admins"
on public.incomplete_orders
for delete
to authenticated
using (
  (select public.current_user_is_admin())
  or (
    (select public.is_non_anonymous_session())
    and user_id = (select public.current_user_id())
  )
);

drop policy if exists "Admins manage orders" on public.orders;
drop policy if exists "Users can create their own orders" on public.orders;
drop policy if exists "Users can view their own orders" on public.orders;
create policy "Orders are viewable by owners or admins"
on public.orders
for select
to authenticated
using (
  (select public.current_user_is_admin())
  or (
    (select public.is_non_anonymous_session())
    and user_id = (select public.current_user_id())
  )
);

create policy "Orders can be created by owners or admins"
on public.orders
for insert
to authenticated
with check (
  (select public.current_user_is_admin())
  or (
    (select public.is_non_anonymous_session())
    and user_id = (select public.current_user_id())
  )
);

create policy "Admins can update orders"
on public.orders
for update
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

create policy "Admins can delete orders"
on public.orders
for delete
to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Admins can manage product categories" on public.product_categories;
drop policy if exists "Anyone can view active categories" on public.product_categories;
create policy "Product categories are viewable by eligible users"
on public.product_categories
for select
to public
using (
  (select public.current_user_is_admin())
  or (
    is_active = true
    and (select public.is_non_anonymous_session())
  )
);

create policy "Admins can insert product categories"
on public.product_categories
for insert
to authenticated
with check ((select public.current_user_is_admin()));

create policy "Admins can update product categories"
on public.product_categories
for update
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

create policy "Admins can delete product categories"
on public.product_categories
for delete
to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Admins can manage products" on public.products;
drop policy if exists "Active products are viewable by everyone" on public.products;
create policy "Products are viewable by eligible users"
on public.products
for select
to public
using (
  (select public.current_user_is_admin())
  or (
    is_active = true
    and (select public.is_non_anonymous_session())
  )
);

create policy "Admins can insert products"
on public.products
for insert
to authenticated
with check ((select public.current_user_is_admin()));

create policy "Admins can update products"
on public.products
for update
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

create policy "Admins can delete products"
on public.products
for delete
to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (
  (select public.is_non_anonymous_session())
  and user_id = (select public.current_user_id())
);

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (
  (select public.is_non_anonymous_session())
  and user_id = (select public.current_user_id())
);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
  (select public.is_non_anonymous_session())
  and user_id = (select public.current_user_id())
)
with check (
  (select public.is_non_anonymous_session())
  and user_id = (select public.current_user_id())
);

drop policy if exists "Users can create reviews" on public.reviews;
drop policy if exists "Users can delete their own reviews" on public.reviews;
drop policy if exists "Users can update their own reviews" on public.reviews;
create policy "Users can create reviews"
on public.reviews
for insert
to authenticated
with check (
  (select public.is_non_anonymous_session())
  and user_id = (select public.current_user_id())
);

create policy "Users can update their own reviews"
on public.reviews
for update
to authenticated
using (
  (select public.is_non_anonymous_session())
  and user_id = (select public.current_user_id())
)
with check (
  (select public.is_non_anonymous_session())
  and user_id = (select public.current_user_id())
);

create policy "Users can delete their own reviews"
on public.reviews
for delete
to authenticated
using (
  (select public.is_non_anonymous_session())
  and user_id = (select public.current_user_id())
);

drop policy if exists "Admins can manage 404 log" on public.route_404_log;
drop policy if exists "Admins can read 404 log" on public.route_404_log;
drop policy if exists "Anyone can log a 404" on public.route_404_log;
create policy "Admins can read 404 log"
on public.route_404_log
for select
to authenticated
using ((select public.current_user_is_admin()));

create policy "Admins can manage 404 log"
on public.route_404_log
for delete
to authenticated
using ((select public.current_user_is_admin()));

create policy "Anyone can log a 404"
on public.route_404_log
for insert
to anon, authenticated
with check (
  char_length(path) >= 1
  and char_length(path) <= 2000
  and left(path, 1) = '/'
  and scope = any (array['public'::text, 'admin'::text])
  and char_length(coalesce(referrer, '')) <= 500
  and char_length(coalesce(user_agent, '')) <= 500
  and (
    user_id is null
    or user_id = (select public.current_user_id())
  )
);

drop policy if exists "Admins can manage roles" on public.user_roles;
drop policy if exists "Admins can view all roles" on public.user_roles;
drop policy if exists "Users can self-assign user role" on public.user_roles;
drop policy if exists "Users can view own roles" on public.user_roles;
create policy "Roles are viewable by their owner or admins"
on public.user_roles
for select
to authenticated
using (
  (select public.current_user_is_admin())
  or (
    (select public.is_non_anonymous_session())
    and user_id = (select public.current_user_id())
  )
);

create policy "Roles can be inserted by their owner or admins"
on public.user_roles
for insert
to authenticated
with check (
  (select public.current_user_is_admin())
  or (
    (select public.is_non_anonymous_session())
    and user_id = (select public.current_user_id())
    and role = 'user'::app_role
  )
);

create policy "Admins can update roles"
on public.user_roles
for update
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

create policy "Admins can delete roles"
on public.user_roles
for delete
to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Users can add to wishlist" on public.wishlists;
drop policy if exists "Users can remove from wishlist" on public.wishlists;
drop policy if exists "Users can view own wishlist" on public.wishlists;
create policy "Users can add to wishlist"
on public.wishlists
for insert
to authenticated
with check (
  (select public.is_non_anonymous_session())
  and user_id = (select public.current_user_id())
);

create policy "Users can view own wishlist"
on public.wishlists
for select
to authenticated
using (
  (select public.is_non_anonymous_session())
  and user_id = (select public.current_user_id())
);

create policy "Users can remove from wishlist"
on public.wishlists
for delete
to authenticated
using (
  (select public.is_non_anonymous_session())
  and user_id = (select public.current_user_id())
);

drop policy if exists "Admins can upload course thumbnails" on storage.objects;
drop policy if exists "Admins can upload product images" on storage.objects;
drop policy if exists "Admins can upload site assets" on storage.objects;
drop policy if exists "Admins can update course thumbnails" on storage.objects;
drop policy if exists "Admins can update product images" on storage.objects;
drop policy if exists "Admins can update site assets" on storage.objects;
drop policy if exists "Admins can delete course thumbnails" on storage.objects;
drop policy if exists "Admins can delete product images" on storage.objects;
drop policy if exists "Admins can delete site assets" on storage.objects;
drop policy if exists "Users can upload their own avatar (scoped)" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;

create policy "Admins can upload course thumbnails"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'course-thumbnails'
  and (select public.current_user_is_admin())
);

create policy "Admins can upload product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (select public.current_user_is_admin())
);

create policy "Admins can upload site assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site_assets'
  and (select public.current_user_is_admin())
);

create policy "Admins can update course thumbnails"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'course-thumbnails'
  and (select public.current_user_is_admin())
)
with check (
  bucket_id = 'course-thumbnails'
  and (select public.current_user_is_admin())
);

create policy "Admins can update product images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and (select public.current_user_is_admin())
)
with check (
  bucket_id = 'product-images'
  and (select public.current_user_is_admin())
);

create policy "Admins can update site assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site_assets'
  and (select public.current_user_is_admin())
)
with check (
  bucket_id = 'site_assets'
  and (select public.current_user_is_admin())
);

create policy "Admins can delete course thumbnails"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'course-thumbnails'
  and (select public.current_user_is_admin())
);

create policy "Admins can delete product images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (select public.current_user_is_admin())
);

create policy "Admins can delete site assets"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site_assets'
  and (select public.current_user_is_admin())
);

create policy "Users can upload their own avatar (scoped)"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (select public.is_non_anonymous_session())
  and (storage.foldername(name))[1] = ((select public.current_user_id()))::text
);

create policy "Users can update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (select public.is_non_anonymous_session())
  and (storage.foldername(name))[1] = ((select public.current_user_id()))::text
)
with check (
  bucket_id = 'avatars'
  and (select public.is_non_anonymous_session())
  and (storage.foldername(name))[1] = ((select public.current_user_id()))::text
);

create policy "Users can delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (select public.is_non_anonymous_session())
  and (storage.foldername(name))[1] = ((select public.current_user_id()))::text
);
