"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CATEGORY_LABEL, formatDuration, rowToMeme, type Meme } from "@/lib/memes";
import { supabaseBrowser } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useToast } from "./Toast";
import { IconBack } from "./Icons";

type Tab = "pending" | "hidden" | "approved";
type Row = Meme & { status: string; userId: string; reports: number; trusted: boolean };

const TABS: { id: Tab; label: string }[] = [
  { id: "pending", label: "На перевірці" },
  { id: "hidden", label: "Скарги" },
  { id: "approved", label: "Опубліковані" },
];

const SELECT = "*, profiles!memes_user_id_fkey(username, trusted)";

export default function AdminView() {
  const user = useUser();
  const toast = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !user) return;
    sb.rpc("is_admin").then(({ data }) => setIsAdmin(Boolean(data)));
  }, [user]);

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    if (!sb || !isAdmin) return;
    const { data, error } = await sb
      .from("memes")
      .select(SELECT)
      .eq("status", tab)
      .order(tab === "hidden" ? "reports_count" : "created_at", { ascending: tab === "pending" })
      .limit(100);
    if (error) return toast(`Помилка: ${error.message}`);
    setRows(
      (data ?? []).map((r) => ({
        ...rowToMeme(r),
        status: r.status,
        userId: r.user_id,
        reports: r.reports_count ?? 0,
        trusted: Boolean(r.profiles?.trusted),
      })),
    );
  }, [isAdmin, tab, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const moderate = async (m: Row, status: "approved" | "rejected" | "hidden") => {
    const sb = supabaseBrowser();
    if (!sb) return;
    setBusy(m.id);
    const { error } = await sb.rpc("moderate_meme", { p_meme: m.id, p_status: status });
    setBusy(null);
    if (error) return toast(`Помилка: ${error.message}`);
    toast(status === "approved" ? "Опубліковано" : status === "rejected" ? "Відхилено" : "Сховано");
    setRows((r) => r.filter((x) => x.id !== m.id));
  };

  const trust = async (m: Row) => {
    const sb = supabaseBrowser();
    if (!sb) return;
    const { error } = await sb.rpc("set_trusted", { p_user: m.userId, p_trusted: !m.trusted });
    if (error) return toast(`Помилка: ${error.message}`);
    toast(m.trusted ? "Автор більше не довірений" : `${m.author} тепер публікує без перевірки`);
    setRows((r) => r.map((x) => (x.userId === m.userId ? { ...x, trusted: !m.trusted } : x)));
  };

  if (user === undefined || (user && isAdmin === null)) {
    return <main className="screen"><p className="muted">Завантаження...</p></main>;
  }
  if (!user || !isAdmin) {
    return (
      <main className="screen" style={{ justifyContent: "center", textAlign: "center" }}>
        <h1 className="h1 display">Тільки для адмінів</h1>
        <Link href="/" className="btn btn-ghost btn-block">На головну</Link>
      </main>
    );
  }

  return (
    <main className="screen">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/profile" className="icon-btn" aria-label="Назад"><IconBack /></Link>
        <h1 className="h1 display" style={{ fontSize: 22 }}>Модерація</h1>
      </div>

      <div className="segmented" role="group" aria-label="Розділи модерації">
        {TABS.map((t) => (
          <button key={t.id} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="empty">
          <strong>Тут порожньо</strong>
          <span className="muted">{tab === "pending" ? "Нових мемів на перевірку немає" : tab === "hidden" ? "Скарг немає" : "Ще нічого не опубліковано"}</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((m) => (
            <article key={m.id} className="card">
              <div className="card-media" style={{ background: m.color }}>
                {m.video ? (
                  <video src={m.video} poster={m.thumb ?? undefined} controls playsInline preload="metadata" />
                ) : m.audio ? (
                  <audio src={m.audio} controls preload="none" />
                ) : (
                  <span className="muted">Без файлу</span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <strong style={{ fontSize: 17 }}>{m.title}</strong>
                <span className="muted" style={{ fontSize: 13 }}>
                  {m.author} · {CATEGORY_LABEL[m.category]} · {formatDuration(m.seconds)}
                  {m.reports > 0 ? ` · скарг: ${m.reports}` : ""}
                </span>
                {m.credit && <span className="muted" style={{ fontSize: 13 }}>Автор оригіналу: {m.credit}</span>}
              </div>
              <div className="grid-2">
                {m.status !== "approved" && (
                  <button className="btn btn-yellow" disabled={busy === m.id} onClick={() => moderate(m, "approved")}>Опублікувати</button>
                )}
                {m.status === "approved" && (
                  <button className="btn btn-ghost" disabled={busy === m.id} onClick={() => moderate(m, "hidden")}>Сховати</button>
                )}
                <button className="btn btn-danger" disabled={busy === m.id} onClick={() => moderate(m, "rejected")}>Відхилити</button>
              </div>
              <button className="btn btn-ghost btn-block" style={{ minHeight: 44, fontSize: 14 }} onClick={() => trust(m)}>
                {m.trusted ? `${m.author}: прибрати довіру` : `Довіряти ${m.author} (без перевірки)`}
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
