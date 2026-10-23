# SHO ZA MEM

Усі меми України в одному місці. Звук і відео — окремо.

## Запуск
npm run dev → http://localhost:3000

## Налаштування Supabase (один раз)
1. Supabase → SQL Editor → New query → встав увесь файл supabase/schema.sql → Run.
2. Authentication → Sign In / Providers → Email → вимкни "Confirm email"
   (поки тестуєш, щоб не чекати листів). Перед запуском для всіх — увімкни назад.
3. Зареєструйся в застосунку (вкладка «Кабінет»).
4. Зроби себе довіреним, щоб твої меми публікувались одразу:
   Table Editor → profiles → твій рядок → trusted = true, is_admin = true → Save.

## Модерація
Кабінет → «Модерація мемів» (видно лише адмінам, is_admin = true).
Там: на перевірці / скарги / опубліковані, кнопки Опублікувати / Відхилити / Сховати,
а також «Довіряти автору» — його меми йтимуть без перевірки.
Мем із 3 скаргами автоматично ховається до перевірки.

## Оновлення 3
Supabase → SQL Editor → запусти supabase/migration-3.sql.
Впиши свою пошту в lib/site.ts.

## Підтвердження пошти (перед запуском для всіх)
1. Authentication → URL Configuration → Site URL = посилання з Vercel.
2. Redirect URLs → додай: https://ТВІЙ-САЙТ.vercel.app/** і http://localhost:3000/**
3. Authentication → Sign In / Providers → Email → увімкни "Confirm email".

## Vercel
Settings → Environment Variables → додай ті самі два рядки з .env.local:
NEXT_PUBLIC_SUPABASE_URL і NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.

## Як це працює
- Відео до 30 с і 50 МБ. Звук (WAV) і прев'ю вирізаються прямо в браузері.
- Файли лежать у Supabase Storage (кошик memes). Безкоштовно — до 1 ГБ.
- Поки в базі немає опублікованих мемів, у стрічці видно тестові.
