-- Keep the protected administrator permanent.
-- This preserves the existing single-admin guard and additionally prevents
-- the protected admin role from being deleted or downgraded.

create or replace function public.enforce_single_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  protected_admin_email constant text := 'nijhumislam570@gmail.com';
  v_new_email text;
  v_old_email text;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    if old.role = 'admin'::public.app_role then
      select lower(email)
        into v_old_email
        from auth.users
       where id = old.user_id;

      if v_old_email = protected_admin_email then
        if tg_op = 'DELETE' then
          raise exception 'The protected admin role cannot be removed';
        end if;

        if new.user_id is distinct from old.user_id or new.role is distinct from old.role then
          raise exception 'The protected admin role cannot be changed';
        end if;
      end if;
    end if;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    if new.role = 'admin'::public.app_role then
      select lower(email)
        into v_new_email
        from auth.users
       where id = new.user_id;

      if v_new_email is distinct from protected_admin_email then
        raise exception 'Only % may hold the admin role (attempted: %)', protected_admin_email, coalesce(v_new_email, '<unknown>');
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_single_admin_trigger on public.user_roles;
create trigger enforce_single_admin_trigger
  before insert or update or delete on public.user_roles
  for each row
  execute function public.enforce_single_admin();

insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
  from auth.users u
 where lower(u.email) = 'nijhumislam570@gmail.com'
on conflict (user_id, role) do nothing;

insert into public.admin_settings (key, value)
select 'protected_admin_user_id', to_jsonb(u.id::text)
  from auth.users u
 where lower(u.email) = 'nijhumislam570@gmail.com'
on conflict (key) do update
set value = excluded.value,
    updated_at = now();
