-- ============================================================
-- SHO ZA MEM — оновлення 5: підписки, фото й імʼя профілю, коментарі
-- Supabase → SQL Editor → New query → встав увесь файл → Run
-- Можна запускати повторно. Включає оновлення 4 (підписки), якщо ти його пропустив.
-- ============================================================

-- Адмін? (з оновлення 3 — повторюємо, щоб файл працював сам по собі)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;
grant execute on function public.is_admin() to authenticated;

-- ---------- Підписки ----------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists follows_following on public.follows (following_id);
alter table public.follows enable row level security;

drop policy if exists "follows readable" on public.follows;
create policy "follows readable" on public.follows for select using (true);
drop policy if exists "follow as myself" on public.follows;
create policy "follow as myself" on public.follows for insert to authenticated with check (auth.uid() = follower_id);
drop policy if exists "unfollow as myself" on public.follows;
create policy "unfollow as myself" on public.follows for delete to authenticated using (auth.uid() = follower_id);

-- ---------- Профіль: імʼя і фото ----------
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_path text;

do $$ begin
  alter table public.profiles add constraint display_name_len check (display_name is null or char_length(display_name) <= 40);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.profiles add constraint username_format check (username ~ '^[A-Za-z0-9_]{3,20}$');
exception when duplicate_object or check_violation then null; end $$;

-- Користувач міняє лише нік, імʼя і фото — не "trusted" і не "is_admin"
revoke update on public.profiles from authenticated, anon;
grant update (username, display_name, avatar_path) on public.profiles to authenticated;

-- ---------- Коментарі ----------
alter table public.memes add column if not exists comments_count int not null default 0;

create table if not exists public.comments (
  id bigint generated always as identity primary key,
  meme_id uuid not null references public.memes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 300),
  created_at timestamptz not null default now()
);
create index if not exists comments_meme on public.comments (meme_id, created_at desc);
alter table public.comments enable row level security;

drop policy if exists "comments readable" on public.comments;
create policy "comments readable" on public.comments for select using (
  exists (select 1 from public.memes m where m.id = meme_id and (m.status = 'approved' or m.user_id = auth.uid()))
  or public.is_admin()
);

drop policy if exists "comment as myself" on public.comments;
create policy "comment as myself" on public.comments for insert to authenticated with check (
  auth.uid() = user_id
  and exists (select 1 from public.memes m where m.id = meme_id and m.status = 'approved')
);

drop policy if exists "delete own comment" on public.comments;
create policy "delete own comment" on public.comments for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

create or replace function public.comments_count_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.memes set comments_count = comments_count + 1 where id = new.meme_id;
  else
    update public.memes set comments_count = greatest(comments_count - 1, 0) where id = old.meme_id;
  end if;
  return null;
end $$;

drop trigger if exists comments_count_sync on public.comments;
create trigger comments_count_sync after insert or delete on public.comments
  for each row execute function public.comments_count_sync();

-- Новий мем: усі лічильники з нуля (тепер і коментарі)
create or replace function public.memes_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.likes_count := 0;
  new.downloads_count := 0;
  new.reports_count := 0;
  new.comments_count := 0;
  new.created_at := now();
  new.status := case
    when exists (select 1 from public.profiles where id = new.user_id and trusted) then 'approved'
    else 'pending'
  end;
  return new;
end $$;
