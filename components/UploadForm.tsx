"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, type Category } from "@/lib/memes";
import { captureThumb, extractAudioWav, fileExt, getDuration } from "@/lib/media";
import { supabaseBrowser } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useToast } from "./Toast";
import { IconUpload } from "./Icons";

const MAX_SECONDS = 30;
const MAX_MB = 50;
const CATS = CATEGORIES.filter((c) => c.id !== "all") as { id: Category; label: string }[];

export default function UploadForm() {
  const toast = useToast();
  const router = useRouter();
  const user = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("react");
  const [credit, setCredit] = useState("");
  const [allowed, setAllowed] = useState(false);
  const [step, setStep] = useState<string | null>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const isSound = file?.type.startsWith("audio") ?? false;

  const onFile = async (f?: File) => {
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) return toast(`Файл завеликий: максимум ${MAX_MB} МБ`);
    try {
      const d = await getDuration(f);
      if (d > MAX_SECONDS + 0.5) return toast(`Задовге: мем має бути до ${MAX_SECONDS} секунд`);
      setSeconds(Math.min(MAX_SECONDS, Math.max(1, Math.round(d))));
      setFile(f);
      setPreview(URL.createObjectURL(f));
    } catch {
      toast("Не вдалося відкрити файл. Спробуй MP4 або MP3");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = supabaseBrowser();
    if (!sb || !user) return toast("Спершу увійди в кабінет");
    if (!file) return toast("Спершу обери відео або звук");
    if (!title.trim()) return toast("Додай назву мему");
    if (!allowed) return toast("Підтверди, що мем можна публікувати");

    const id = crypto.randomUUID();
    const base = `${user.id}/${id}`;
    let video_path: string | null = null;
    let audio_path: string | null = null;
    let thumb_path: string | null = null;

    try {
      if (isSound) {
        setStep("Завантажую звук...");
        audio_path = `${base}.${fileExt(file, "mp3")}`;
        const up = await sb.storage.from("memes").upload(audio_path, file, { contentType: file.type });
        if (up.error) throw up.error;
      } else {
        setStep("Завантажую відео...");
        video_path = `${base}.${fileExt(file, "mp4")}`;
        const up = await sb.storage.from("memes").upload(video_path, file, { contentType: file.type });
        if (up.error) throw up.error;

        setStep("Роблю прев'ю...");
        const thumb = await captureThumb(file);
        if (thumb) {
          thumb_path = `${base}.jpg`;
          const t = await sb.storage.from("memes").upload(thumb_path, thumb, { contentType: "image/jpeg" });
          if (t.error) thumb_path = null;
        }

        setStep("Вирізаю звук...");
        const wav = await extractAudioWav(file);
        if (wav) {
          audio_path = `${base}.wav`;
          const a = await sb.storage.from("memes").upload(audio_path, wav, { contentType: "audio/wav" });
          if (a.error) audio_path = null;
        }
      }

      setStep("Публікую...");
      const { data, error } = await sb
        .from("memes")
        .insert({
          id,
          user_id: user.id,
          title: title.trim(),
          author_credit: credit.trim() || null,
          kind: isSound ? "sound" : "video",
          category,
          seconds,
          video_path,
          audio_path,
          thumb_path,
        })
        .select("status")
        .single();
      if (error) throw error;

      toast(data?.status === "approved" ? "Опубліковано!" : "Мем на перевірці — зʼявиться після модерації");
      router.push("/profile");
    } catch (err) {
      const msg = (err as { message?: string })?.message || "Щось пішло не так";
      toast(`Не вийшло: ${msg}`);
    } finally {
      setStep(null);
    }
  };

  if (user === undefined) return <main className="screen"><p className="muted">Завантаження...</p></main>;

  if (user === null) {
    return (
      <main className="screen" style={{ justifyContent: "center", textAlign: "center" }}>
        <h1 className="h1 display">Новий мем</h1>
        <p className="muted">Щоб додавати меми, увійди або створи акаунт — це хвилина.</p>
        <Link href="/profile" className="btn btn-yellow btn-block">Увійти в кабінет</Link>
      </main>
    );
  }

  return (
    <form className="screen" onSubmit={submit}>
      <h1 className="h1 display">Новий мем</h1>

      <label className="drop">
        {preview && !isSound ? (
          <video src={preview} autoPlay muted loop playsInline />
        ) : preview && isSound ? (
          <>
            <strong>{file?.name}</strong>
            <audio src={preview} controls style={{ position: "relative" }} />
          </>
        ) : (
          <>
            <span className="drop-icon"><IconUpload /></span>
            <strong>Обери відео або звук</strong>
            <span className="muted" style={{ fontSize: 13 }}>До {MAX_SECONDS} секунд. Звук і прев&apos;ю з відео зробимо самі</span>
          </>
        )}
        <input type="file" accept="video/*,audio/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>

      <label className="field">
        <span>Назва мему</span>
        <input className="input" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Наприклад: коли пара о 8:00" />
      </label>

      <div className="field">
        <span>Категорія</span>
        <div className="chips">
          {CATS.map((c) => (
            <button key={c.id} type="button" className="chip" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>Автор оригіналу <span className="muted" style={{ fontWeight: 500 }}>(якщо знаєш)</span></span>
        <input className="input" maxLength={60} value={credit} onChange={(e) => setCredit(e.target.value)} placeholder="@нікнейм" />
      </label>

      <label className="check">
        <input type="checkbox" checked={allowed} onChange={(e) => setAllowed(e.target.checked)} />
        <span>Це мій мем або автор не проти, що він тут буде. Мем відповідає <Link href="/rules" className="link">Правилам</Link>.</span>
      </label>

      <button type="submit" className="btn btn-yellow btn-block display" style={{ minHeight: 56, fontSize: 17 }} disabled={!!step}>
        {step ?? "Опублікувати"}
      </button>
    </form>
  );
}
