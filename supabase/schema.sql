-- ============================================================
-- SHO ZA MEM — база даних
-- Як запустити: Supabase → SQL Editor → New query → встав увесь файл → Run
-- Файл можна запускати повторно — нічого не зламається.
-- ============================================================

-- ---------- Профілі ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  trusted boolean not null default false,   -- true = меми публікуються одразу, без перевірки
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);

drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- Користувач може міняти лише свій нік, а не "trusted" чи "is_admin"
revoke update on public.profiles from authenticated, anon;
grant update (username) on public.profiles to authenticated;

-- Автоматично створюємо профіль після реєстрації
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v text := coalesce(nullif(new.raw_user_meta_data->>'username', ''), 'user');
begin
  if exists (select 1 from public.profiles where username = v) then
    v := v || '_' || substr(new.id::text, 1, 4);
  end if;
  insert into public.profiles (id, username) values (new.id, v);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Меми ----------
create table if not exists public.memes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  author_credit text check (author_credit is null or char_length(author_credit) <= 60),
  kind text not null default 'video' check (kind in ('video', 'sound')),
  category text not null default 'react' check (category in ('react', 'study', 'cats', 'cringe')),
  seconds int not null check (seconds between 1 and 30),
  video_path text,
  audio_path text,
  thumb_path text,
  -- pending = на перевірці, approved = опубліковано, rejected = відхилено, hidden = сховано через скарги
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden')),
  likes_count int not null default 0,
  downloads_count int not null default 0,
  reports_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists memes_status_created on public.memes (status, created_at desc);
alter table public.memes enable row level security;

drop policy if exists "approved memes public" on public.memes;
create policy "approved memes public" on public.memes for select
  using (status = 'approved' or auth.uid() = user_id);

drop policy if exists "insert own memes" on public.memes;
create policy "insert own memes" on public.memes for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "delete own memes" on public.memes;
create policy "delete own memes" on public.memes for delete to authenticated
  using (auth.uid() = user_id);

-- Новий мем: лічильники з нуля, статус вирішує сервер (довірені — одразу, решта — на перевірку)
create or replace function public.memes_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.likes_count := 0;
  new.downloads_count := 0;
  new.reports_count := 0;
  new.created_at := now();
  new.status := case
    when exists (select 1 from public.profiles where id = new.user_id and trusted) then 'approved'
    else 'pending'
  end;
  return new;
end $$;

drop trigger if exists memes_before_insert on public.memes;
create trigger memes_before_insert before insert on public.memes
  for each row execute function public.memes_before_insert();

-- ---------- Лайки ----------
create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  meme_id uuid not null references public.memes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, meme_id)
);
alter table public.likes enable row level security;

drop policy if exists "own likes read" on public.likes;
create policy "own likes read" on public.likes for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own likes insert" on public.likes;
create policy "own likes insert" on public.likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "own likes delete" on public.likes;
create policy "own likes delete" on public.likes for delete to authenticated using (auth.uid() = user_id);

create or replace function public.likes_count_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.memes set likes_count = likes_count + 1 where id = new.meme_id;
  else
    update public.memes set likes_count = greatest(likes_count - 1, 0) where id = old.meme_id;
  end if;
  return null;
end $$;

drop trigger if exists likes_count_sync on public.likes;
create trigger likes_count_sync after insert or delete on public.likes
  for each row execute function public.likes_count_sync();

-- ---------- Збережене ----------
create table if not exists public.saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  meme_id uuid not null references public.memes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, meme_id)
);
alter table public.saves enable row level security;

drop policy if exists "own saves read" on public.saves;
create policy "own saves read" on public.saves for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own saves insert" on public.saves;
create policy "own saves insert" on public.saves for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "own saves delete" on public.saves;
create policy "own saves delete" on public.saves for delete to authenticated using (auth.uid() = user_id);

-- ---------- Скарги ----------
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  meme_id uuid not null references public.memes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (meme_id, user_id)
);
alter table public.reports enable row level security;

drop policy if exists "report as myself" on public.reports;
create policy "report as myself" on public.reports for insert to authenticated with check (auth.uid() = user_id);

-- 3 скарги — мем ховається, поки ти його не перевіриш
create or replace function public.reports_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.memes
     set reports_count = reports_count + 1,
         status = case when reports_count + 1 >= 3 and status = 'approved' then 'hidden' else status end
   where id = new.meme_id;
  return null;
end $$;

drop trigger if exists reports_sync on public.reports;
create trigger reports_sync after insert on public.reports
  for each row execute function public.reports_sync();

-- ---------- Лічильник скачувань ----------
create or replace function public.count_download(p_meme uuid)
returns void language sql security definer set search_path = public as $$
  update public.memes set downloads_count = downloads_count + 1 where id = p_meme and status = 'approved';
$$;
grant execute on function public.count_download(uuid) to anon, authenticated;

-- ---------- Сховище файлів ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memes', 'memes', true, 52428800,
  array['video/mp4', 'video/quicktime', 'video/webm',
        'audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac',
        'image/jpeg'])
on conflict (id) do nothing;

drop policy if exists "memes upload own folder" on storage.objects;
create policy "memes upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'memes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "memes delete own files" on storage.objects;
create policy "memes delete own files" on storage.objects for delete to authenticated
  using (bucket_id = 'memes' and (storage.foldername(name))[1] = auth.uid()::text);
