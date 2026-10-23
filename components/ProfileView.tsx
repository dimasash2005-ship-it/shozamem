"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { rowToMeme, type Meme } from "@/lib/memes";
import { supabaseBrowser } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import AuthForm from "./AuthForm";
import { useToast } from "./Toast";
import { IconPlus } from "./Icons";

type Tab = "mine" | "saved";
type MyMeme = Meme & { status: string };

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: "На перевірці", bg: "#F5F5F0", color: "#0e0e10" },
  approved: { label: "Опубліковано", bg: "#FFD700", color: "#0e0e10" },
  rejected: { label: "Відхилено", bg: "#FF5A5A", color: "#0e0e10" },
  hidden: { label: "Сховано", bg: "#A8A8A0", color: "#0e0e10" },
};

const SELECT = "*, profiles!memes_user_id_fkey(username)";

export default function ProfileView() {
  const user = useUser();
  const toast = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("mine");
  const [username, setUsername] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [mine, setMine] = useState<MyMeme[]>([]);
  const [saved, setSaved] = useState<Meme[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !user) return;
    sb.from("profiles")
      .select("username, is_admin")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setUsername(data?.username ?? "");
        setIsAdmin(Boolean(data?.is_admin));
      });
    sb.from("memes")
      .select(SELECT)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setMine((data ?? []).map((r) => ({ ...rowToMeme(r), status: r.status as string }))));
    sb.from("saves")
      .select(`created_at, memes(${SELECT})`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSaved((data ?? []).map((s: any) => s.memes).filter(Boolean).map(rowToMeme)),
      );
  }, [user]);

  if (user === undefined) return <main className="screen"><p className="muted">Завантаження...</p></main>;
  if (user === null) return <AuthForm />;

  const totalDownloads = mine.reduce((s, m) => s + m.downloads, 0);
  const totalLikes = mine.reduce((s, m) => s + m.likes, 0);
  const items: (Meme & { status?: string })[] = tab === "mine" ? mine : saved;

  const signOut = async () => {
    await supabaseBrowser()?.auth.signOut();
    toast("Ти вийшов з акаунта");
  };

  const deleteAccount = async () => {
    const sb = supabaseBrowser();
    if (!sb) return;
    setDeleting(true);
    try {
      // 1. Прибираємо всі свої файли
      const { data: files } = await sb.storage.from("memes").list(user.id, { limit: 1000 });
      if (files && files.length > 0) {
        await sb.storage.from("memes").remove(files.map((f) => `${user.id}/${f.name}`));
      }
      // 2. Видаляємо акаунт (разом з мемами, лайками і збереженим)
      const { error } = await sb.rpc("delete_my_account");
      if (error) throw error;
      await sb.auth.signOut();
      toast("Акаунт видалено. Дякуємо, що був з нами!");
      router.push("/");
    } catch (err) {
      toast(`Не вийшло: ${(err as { message?: string })?.message ?? "спробуй ще раз"}`);
      setDeleting(false);
    }
  };

  return (
    <main className="screen">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="h1 display" style={{ fontSize: 22 }}>Кабінет</h1>
        <button className="btn btn-ghost btn-sm" onClick={signOut}>Вийти</button>
      </div>

      <section className="profile-card">
        <div className="avatar" aria-hidden="true">{(username[0] ?? "?").toUpperCase()}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <strong style={{ fontSize: 20 }}>@{username || "…"}</strong>
          <span className="muted" style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</span>
          {isAdmin && <span className="pill pill-blue">Адмін</span>}
        </div>
      </section>

      <div className="grid-3">
        <div className="stat"><b>{mine.length}</b><span className="muted" style={{ fontSize: 12 }}>мої меми</span></div>
        <div className="stat"><b>{totalDownloads}</b><span className="muted" style={{ fontSize: 12 }}>скачали в мене</span></div>
        <div className="stat"><b>{totalLikes}</b><span className="muted" style={{ fontSize: 12 }}>вподобань</span></div>
      </div>

      <Link href="/upload" className="btn btn-yellow btn-block">
        <IconPlus size={20} /> Додати мем
      </Link>

      {isAdmin && (
        <Link href="/admin" className="btn btn-blue btn-block">Модерація мемів</Link>
      )}

      <div className="segmented" style={{ gridTemplateColumns: "1fr 1fr" }} role="group" aria-label="Мої розділи">
        <button aria-pressed={tab === "mine"} onClick={() => setTab("mine")}>Мої меми</button>
        <button aria-pressed={tab === "saved"} onClick={() => setTab("saved")}>Збережене</button>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <strong>{tab === "mine" ? "Поки порожньо" : "Нічого не збережено"}</strong>
          <span className="muted">{tab === "mine" ? "Додай свій перший мем — це 30 секунд" : "Тисни закладку на мемі, і він зʼявиться тут"}</span>
        </div>
      ) : (
        <div className="grid-3">
          {items.map((m) => {
            const st = m.status ? STATUS[m.status] : null;
            const bg = m.thumb
              ? `linear-gradient(to top, rgba(14,14,16,0.85), rgba(14,14,16,0) 60%), center / cover no-repeat url(${m.thumb})`
              : m.color;
            const body = (
              <>
                {st && (
                  <span style={{ position: "absolute", top: 8, left: 8, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                )}
                {m.title}
              </>
            );
            return m.status && m.status !== "approved" ? (
              <div key={m.id} className="tile" style={{ background: bg, height: 120, position: "relative" }}>{body}</div>
            ) : (
              <Link key={m.id} href={`/meme/${m.id}`} className="tile" style={{ background: bg, height: 120, position: "relative" }}>{body}</Link>
            );
          })}
        </div>
      )}

      <nav className="menu" aria-label="Інформація">
        <Link href="/rules">Правила</Link>
        <Link href="/privacy">Конфіденційність</Link>
      </nav>

      {!confirmDelete ? (
        <button className="btn btn-link" onClick={() => setConfirmDelete(true)}>Видалити акаунт</button>
      ) : (
        <div className="card" style={{ borderColor: "var(--red)" }}>
          <strong>Видалити акаунт назавжди?</strong>
          <span className="muted">Зникнуть усі твої меми, файли, лайки і збережене. Повернути не вийде.</span>
          <div className="grid-2">
            <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>Скасувати</button>
            <button className="btn btn-danger" onClick={deleteAccount} disabled={deleting}>{deleting ? "Видаляю..." : "Видалити"}</button>
          </div>
        </div>
      )}
    </main>
  );
}
