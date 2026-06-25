-- EverAfter Hub database schema
-- Run this in your PostgreSQL database (Supabase/Postgres)

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  company_name text,
  phone text,
  password text not null,
  role text not null default 'user' check (role in ('admin', 'user', 'guest')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'role'
  ) then
    alter table public.users add column role text;
  end if;
end $$;

alter table public.users alter column role set default 'user';
update public.users set role = coalesce(role, 'user') where role is null;
alter table public.users alter column role set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_role_check'
  ) then
    alter table public.users
      add constraint users_role_check check (role in ('admin', 'user', 'guest'));
  end if;
end $$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  event_type text not null default 'wedding',
  event_name text not null,
  host_name text,
  event_date date not null,
  venue text,
  slug text not null unique,
  guest_access_url text,
  qr_code_value text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  full_name text not null,
  table_number integer,
  dietary_requirements text,
  created_at timestamptz not null default now()
);

create table if not exists public.timeline_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  event_time text,
  title text not null,
  location text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  course_type text not null check (course_type in ('starter', 'main', 'dessert')),
  dish_name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  image_url text not null,
  caption text,
  uploaded_by text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.guestbook (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_name text,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.song_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  song_title text not null,
  requested_by text,
  votes integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_user_id on public.events(user_id);
create index if not exists idx_guests_event_id on public.guests(event_id);
create index if not exists idx_timeline_event_id on public.timeline_items(event_id);
create index if not exists idx_menu_event_id on public.menu_items(event_id);
create index if not exists idx_photos_event_id on public.photos(event_id);
create index if not exists idx_guestbook_event_id on public.guestbook(event_id);
create index if not exists idx_song_requests_event_id on public.song_requests(event_id);

-- Seed admin account
insert into public.users (email, full_name, company_name, phone, password, role)
values ('admin@everafter.com', 'Admin User', 'EverAfter Hub', '+1234567890', 'admin123', 'admin')
on conflict (email) do nothing;
