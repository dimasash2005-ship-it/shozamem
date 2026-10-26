"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CONTACT_EMAIL } from "@/lib/site";
import { supabaseBrowser } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useToast } from "./Toast";
import Sheet from "./Sheet";

// Три крапки: усі налаштування й інформація в одному меню
export default function MoreMenu() {
  const user = useUser();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !user) return;
    sb.rpc("is_admin").then(({ data }) => setIsAdmin(Boolean(data)));
  }, [user]);

  const close = () => setOpen(false);

  const signOut = async () => {
    await supabaseBrowser()?.auth.signOut();
    close();
    toast("Ти вийшов з акаунта");
  };

  const shareApp = async () => {
    const url = window.location.origin;
    try {
      if (navigator.share) await navigator.share({ title: "SHO ZA MEM", text: "Усі меми України в одному місці", url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Посилання на застосунок скопійовано");
      }
    } catch {
      // закрили меню — ок
    }
  };

  return (
    <>
      <button className="dots-btn" aria-label="Меню" aria-expanded={open} onClick={() => setOpen(true)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="2.2" /><circle cx="12" cy="12" r="2.2" /><circle cx="19" cy="12" r="2.2" />
        </svg>
      </button>

      <Sheet open={open} onClose={close} title="Меню">
        <nav className="menu" aria-label="Акаунт">
          {user ? (
            <>
              <Link href="/profile" onClick={close}>Мій кабінет</Link>
              <Link href="/settings" onClick={close}>Редагувати профіль</Link>
              {isAdmin && <Link href="/admin" onClick={close}>Модерація мемів</Link>}
            </>
          ) : (
            <Link href="/profile" onClick={close}>Увійти або зареєструватись</Link>
          )}
          <Link href="/upload" onClick={close}>Додати мем</Link>
        </nav>

        <nav className="menu" aria-label="Інформація">
          <button onClick={shareApp}>Поділитися застосунком</button>
          <Link href="/rules" onClick={close}>Правила</Link>
          <Link href="/privacy" onClick={close}>Конфіденційність</Link>
          <a href={`mailto:${CONTACT_EMAIL}`}>Написати нам</a>
        </nav>

        {user && (
          <nav className="menu" aria-label="Вихід">
            <button onClick={signOut}>Вийти</button>
            <Link href="/settings#delete" onClick={close} className="danger">Видалити акаунт</Link>
          </nav>
        )}

        <p className="muted" style={{ textAlign: "center", fontSize: 12, margin: 0 }}>SHO ZA MEM · версія 0.5</p>
      </Sheet>
    </>
  );
}
