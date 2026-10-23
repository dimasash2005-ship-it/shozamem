-- ============================================================
-- SHO ZA MEM — оновлення 3: адмінка, модерація, видалення акаунта
-- Supabase → SQL Editor → New query → встав увесь файл → Run
-- Можна запускати повторно.
-- ============================================================

-- Чи поточний користувач — адмін
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;
grant execute on function public.is_admin() to authenticated;

-- Адмін бачить усі меми (на перевірці, сховані, відхилені)
drop policy if exists "admins read all memes" on public.memes;
create policy "admins read all memes" on public.memes for select to authenticated
  using (public.is_admin());

-- Адмін бачить скарги
drop policy if exists "admins read reports" on public.reports;
create policy "admins read reports" on public.reports for select to authenticated
  using (public.is_admin());

-- Змінити статус мему (лише адмін)
create or replace function public.moderate_meme(p_meme uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Тільки для адмінів';
  end if;
  if p_status not in ('pending', 'approved', 'rejected', 'hidden') then
    raise exception 'Невідомий статус';
  end if;
  update public.memes
     set status = p_status,
         reports_count = case when p_status = 'approved' then 0 else reports_count end
   where id = p_meme;
  if p_status = 'approved' then
    delete from public.reports where meme_id = p_meme;
  end if;
end $$;
grant execute on function public.moderate_meme(uuid, text) to authenticated;

-- Зробити автора довіреним (його меми публікуються одразу) — лише адмін
create or replace function public.set_trusted(p_user uuid, p_trusted boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Тільки для адмінів';
  end if;
  update public.profiles set trusted = p_trusted where id = p_user;
end $$;
grant execute on function public.set_trusted(uuid, boolean) to authenticated;

-- Видалити свій акаунт разом з усіма мемами, лайками і збереженим.
-- Файли застосунок видаляє сам перед викликом цієї функції.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Спершу увійди';
  end if;
  delete from auth.users where id = auth.uid();
end $$;
grant execute on function public.delete_my_account() to authenticated;
