"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Meme } from "@/lib/memes";
import { publicUrl, supabaseBrowser } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useToast } from "./Toast";
import Sheet from "./Sheet";
import Avatar from "./Avatar";
import { IconShare } from "./Icons";

type Comment = { id: number; body: string; createdAt: number; userId: string; username: string; avatar: string | null };

function ago(t: number) {
  const s = Math.max(1, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "щойно";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} хв`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} год`;
  return `${Math.round(h / 24)} дн`;
}

export default function CommentsSheet({
  meme,
  open,
  onClose,
  onCount,
}: {
  meme: Meme | null;
  open: boolean;
  onClose: () => void;
  onCount?: (memeId: string, delta: number) => void;
}) {
  const user = useUser();
  const toast = useToast();
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!open || !meme || !meme.real || !sb) {
      setItems([]);
      return;
    }
    setLoading(true);
    sb.from("comments")
      .select("id, body, created_at, user_id, profiles!comments_user_id_fkey(username, avatar_path)")
      .eq("meme_id", meme.id)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setItems(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data ?? []).map((c: any) => ({
            id: c.id,
            body: c.body,
            createdAt: Date.parse(c.created_at),
            userId: c.user_id,
            username: c.profiles?.username ?? "анонім",
            avatar: publicUrl(c.profiles?.avatar_path),
          })),
        );
        setLoading(false);
      });
  }, [open, meme]);

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !user) return;
    sb.rpc("is_admin").then(({ data }) => setIsAdmin(Boolean(data)));
  }, [user]);

  if (!meme) return null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    if (!meme.real) return toast("Під тестовими мемами коментарі не зберігаються");
    const sb = supabaseBrowser();
    if (!sb || !user) return toast("Увійди в кабінет, щоб коментувати");
    setSending(true);
    const { data, error } = await sb
      .from("comments")
      .insert({ meme_id: meme.id, user_id: user.id, body })
      .select("id, body, created_at, user_id, profiles!comments_user_id_fkey(username, avatar_path)")
      .single();
    setSending(false);
    if (error || !data) return toast("Не вийшло надіслати, спробуй ще раз");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c: any = data;
    setItems((list) => [
      { id: c.id, body: c.body, createdAt: Date.parse(c.created_at), userId: c.user_id, username: c.profiles?.username ?? "я", avatar: publicUrl(c.profiles?.avatar_path) },
      ...list,
    ]);
    setText("");
    onCount?.(meme.id, 1);
  };

  const remove = async (c: Comment) => {
    const sb = supabaseBrowser();
    if (!sb) return;
    const { error } = await sb.from("comments").delete().eq("id", c.id);
    if (error) return toast("Не вийшло видалити");
    setItems((list) => list.filter((x) => x.id !== c.id));
    onCount?.(meme.id, -1);
  };

  return (
    <Sheet open={open} onClose={onClose} title={`Коментарі${items.length ? ` · ${items.length}` : ""}`} tall>
      <div className="comments">
        {loading ? (
          <p className="muted" style={{ textAlign: "center" }}>Завантаження...</p>
        ) : items.length === 0 ? (
          <div className="empty">
            <strong>Ще ніхто не прокоментував</strong>
            <span className="muted">Будь першим — напиши, що думаєш про цей мем</span>
          </div>
        ) : (
          items.map((c) => (
            <div key={c.id} className="comment">
              <Link href={`/u/${c.username}`} aria-label={`@${c.username}`}><Avatar src={c.avatar} name={c.username} size={36} /></Link>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <Link href={`/u/${c.username}`} style={{ fontWeight: 700, fontSize: 14 }}>@{c.username}</Link>
                  <span className="muted" style={{ fontSize: 12 }}>{ago(c.createdAt)}</span>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: 15, lineHeight: 1.4, wordBreak: "break-word" }}>{c.body}</p>
              </div>
              {(user?.id === c.userId || isAdmin) && (
                <button className="btn-link" style={{ fontSize: 12, minHeight: 32 }} onClick={() => remove(c)}>Видалити</button>
              )}
            </div>
          ))
        )}
      </div>

      <form className="comment-form" onSubmit={send}>
        <label className="sr-only" htmlFor="comment-input">Коментар</label>
        <input
          id="comment-input"
          className="input"
          maxLength={300}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Напиши коментар..." : "Увійди, щоб коментувати"}
          disabled={!user}
        />
        <button type="submit" className="icon-btn send-btn" aria-label="Надіслати" disabled={!user || sending || !text.trim()}>
          <IconShare size={20} />
        </button>
      </form>
    </Sheet>
  );
}
