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
Table Editor → memes → фільтр status = pending.
Хороший мем → status = approved. Поганий → rejected.
Мем із 3 скаргами автоматично стає hidden — перевір і поверни approved або залиш.

## Vercel
Settings → Environment Variables → додай ті самі два рядки з .env.local:
NEXT_PUBLIC_SUPABASE_URL і NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.

## Як це працює
- Відео до 30 с і 50 МБ. Звук (WAV) і прев'ю вирізаються прямо в браузері.
- Файли лежать у Supabase Storage (кошик memes). Безкоштовно — до 1 ГБ.
- Поки в базі немає опублікованих мемів, у стрічці видно тестові.
