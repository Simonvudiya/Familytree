-- OUR FAMILY HISTORY
-- Run this in the Supabase SQL editor.

create extension if not exists pgcrypto;

create type public.member_role as enum ('member','compiler','admin');
create type public.story_status as enum ('draft','published','archived');

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid references public.families(id) on delete set null,
  full_name text not null,
  role public.member_role not null default 'member',
  birth_year int,
  branch text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  content text not null,
  category text,
  event_year int,
  status public.story_status not null default 'draft',
  include_in_book boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.story_versions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  version_number int not null,
  content text not null,
  title text not null,
  edited_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(story_id, version_number)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.family_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  description text,
  event_year int,
  event_date date,
  person_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.family_tree (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  person_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.profiles(id) on delete set null,
  relationship text,
  created_at timestamptz not null default now()
);

-- Automatically create a profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Timestamp helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger stories_updated_at before update on public.stories
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.stories enable row level security;
alter table public.story_versions enable row level security;
alter table public.comments enable row level security;
alter table public.family_events enable row level security;
alter table public.family_tree enable row level security;

create or replace function public.is_family_member(target_family uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and family_id = target_family
  );
$$;

create or replace function public.is_family_admin(target_family uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and family_id = target_family
      and role in ('admin','compiler')
  );
$$;

-- Families
create policy "family members can read family"
on public.families for select
using (public.is_family_member(id));

-- Profiles
create policy "family members can read profiles"
on public.profiles for select
using (
  family_id is not null and public.is_family_member(family_id)
);

create policy "users can update own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- Stories
create policy "members can read published stories"
on public.stories for select
using (
  public.is_family_member(family_id)
  and (
    status = 'published'
    or author_id = auth.uid()
    or public.is_family_admin(family_id)
  )
);

create policy "members can create stories"
on public.stories for insert
with check (
  author_id = auth.uid()
  and public.is_family_member(family_id)
);

create policy "authors can update own stories"
on public.stories for update
using (
  author_id = auth.uid()
  or public.is_family_admin(family_id)
)
with check (
  author_id = auth.uid()
  or public.is_family_admin(family_id)
);

create policy "authors/admins can delete stories"
on public.stories for delete
using (
  author_id = auth.uid()
  or public.is_family_admin(family_id)
);

-- Versions
create policy "family can read versions"
on public.story_versions for select
using (
  exists (
    select 1 from public.stories s
    where s.id = story_id
      and public.is_family_member(s.family_id)
  )
);

create policy "authenticated users can create versions"
on public.story_versions for insert
with check (edited_by = auth.uid());

-- Comments
create policy "family can read comments"
on public.comments for select
using (
  exists (
    select 1 from public.stories s
    where s.id = story_id
      and public.is_family_member(s.family_id)
  )
);

create policy "family can comment"
on public.comments for insert
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.stories s
    where s.id = story_id
      and public.is_family_member(s.family_id)
      and s.status = 'published'
  )
);

-- Timeline
create policy "family can read events"
on public.family_events for select
using (public.is_family_member(family_id));

create policy "admins can manage events"
on public.family_events for all
using (public.is_family_admin(family_id))
with check (public.is_family_admin(family_id));

-- Tree
create policy "family can read tree"
on public.family_tree for select
using (public.is_family_member(family_id));

create policy "admins can manage tree"
on public.family_tree for all
using (public.is_family_admin(family_id))
with check (public.is_family_admin(family_id));

-- Helpful indexes
create index stories_family_status_idx on public.stories(family_id, status);
create index stories_author_idx on public.stories(author_id);
create index stories_event_year_idx on public.stories(event_year);
create index versions_story_idx on public.story_versions(story_id, version_number);
create index events_family_year_idx on public.family_events(family_id, event_year);
