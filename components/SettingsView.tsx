"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { publicUrl, supabaseBrowser } from "@/lib/supabase";
import { resizeAvatar } from "@/lib/image";
import { useUser } from "@/lib/useUser";
import { useToast } from "./Toast";
import Avatar from "./Avatar";
import { IconBack } from "./Icons";

export default function SettingsView() {
  const user = useUser();
  const toast = useToast();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [newAvatar, setNewAvatar] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !user) return;
    sb.from("profiles")
      .select("username, display_name, avatar_path")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setUsername(data?.username ?? "");
        setDisplayName(data?.display_name ?? "");
        setAvatarPath(data?.avatar_path ?? null);
      });
  }, [user]);

  useEffect(() => {
    if (window.location.hash === "#delete") setConfirmDelete(true);
  }, []);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  if (user === undefined) return <main className="screen"><p className="muted">Завантаження...</p></main>;
  if (user === null) {
    return (
      <main className="screen" style={{ justifyContent: "center", textAlign: "center" }}>
        <p className="muted">Щоб редагувати профіль, увійди в акаунт.</p>
        <Link href="/profile" className="btn btn-yellow btn-block">Увійти</Link>
      </main>
    );
  }

  const pickPhoto = async (f?: File) => {
    if (!f) return;
    try {
      const blob = await resizeAvatar(f);
      setNewAvatar(blob);
      setPreview(URL.createObjectURL(blob));
    } catch (err) {
      toast((err as Error).message);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = supabaseBrowser();
    if (!sb) return;
    if (!/^[a-z0-9_]{3,20}$/i.test(username)) return toast("Нік: 3–20 латинських літер, цифр або _");
    if (displayName.length > 40) return toast("Імʼя — до 40 символів");
    setSaving(true);
    try {
      let path = avatarPath;
      if (newAvatar) {
        path = `${user.id}/avatar-${Date.now()}.jpg`;
        const up = await sb.storage.from("memes").upload(path, newAvatar, { contentType: "image/jpeg" });
        if (up.error) throw up.error;
        if (avatarPath) await sb.storage.from("memes").remove([avatarPath]);
      }
      const { error } = await sb
        .from("profiles")
        .update({ username, display_name: displayName.trim() || null, avatar_path: path })
        .eq("id", user.id);
      if (error) {
        if (error.code === "23505") throw new Error("Такий нік уже зайнятий");
        throw error;
      }
      setAvatarPath(path);
      setNewAvatar(null);
      toast("Профіль збережено");
    } catch (err) {
      toast(`Не вийшло: ${(err as { message?: string })?.message ?? "спробуй ще раз"}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    const sb = supabaseBrowser();
    if (!sb) return;
    setDeleting(true);
    try {
      const { data: files } = await sb.storage.from("memes").list(user.id, { limit: 1000 });
      if (files && files.length > 0) {
        await sb.storage.from("memes").remove(files.map((f) => `${user.id}/${f.name}`));
      }
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
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/profile" className="icon-btn" aria-label="Назад"><IconBack /></Link>
        <h1 className="h1 display" style={{ fontSize: 22 }}>Профіль</h1>
      </div>

      <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <label className="avatar-picker">
          <Avatar src={preview ?? publicUrl(avatarPath)} name={username} size={104} ring />
          <span className="btn btn-ghost btn-sm">Змінити фото</span>
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} />
        </label>

        <label className="field">
          <span>Імʼя</span>
          <input className="input" maxLength={40} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Як тебе звати" />
        </label>

        <label className="field">
          <span>Нік</span>
          <input className="input" maxLength={20} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="memolog_2026" autoComplete="username" />
          <span className="muted" style={{ fontSize: 12, fontWeight: 500 }}>Латиниця, цифри і _ · твоя сторінка: /u/{username || "нік"}</span>
        </label>

        <label className="field">
          <span>Пошта</span>
          <input className="input" value={user.email ?? ""} disabled />
        </label>

        <button type="submit" className="btn btn-yellow btn-block" disabled={saving}>
          {saving ? "Зберігаю..." : "Зберегти"}
        </button>
      </form>

      <nav className="menu" aria-label="Інформація">
        <Link href="/rules">Правила</Link>
        <Link href="/privacy">Конфіденційність</Link>
      </nav>

      <div id="delete">
        {!confirmDelete ? (
          <button className="btn btn-link btn-block" onClick={() => setConfirmDelete(true)}>Видалити акаунт</button>
        ) : (
          <div className="card" style={{ borderColor: "var(--red)" }}>
            <strong>Видалити акаунт назавжди?</strong>
            <span className="muted">Зникнуть усі твої меми, файли, коментарі, лайки і збережене. Повернути не вийде.</span>
            <div className="grid-2">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>Скасувати</button>
              <button className="btn btn-danger" onClick={deleteAccount} disabled={deleting}>{deleting ? "Видаляю..." : "Видалити"}</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
