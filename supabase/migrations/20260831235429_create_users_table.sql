-- public.users mirrors auth.users so app tables can foreign-key to it
-- without touching the auth schema directly.
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

-- Trigger that populates public.users on every new auth signup.
-- security definer + explicit search_path is the Supabase-recommended
-- pattern so the trigger can write to public even though auth signups
-- run with restricted privileges.
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
