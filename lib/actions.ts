"use client";

import { fileName, type Meme } from "./memes";
import { supabaseBrowser } from "./supabase";

// Скачати відео або звук мему
export function downloadFile(meme: Meme, kind: "video" | "audio", toast: (t: string) => void) {
  const src = kind === "video" ? meme.video : meme.audio;
  if (!src) {
    if (!meme.real) toast(kind === "video" ? "Це тестовий мем — відео тут немає" : "Це тестовий мем — звуку тут немає");
    else toast(kind === "video" ? "У цього мему лише звук" : "Для цього мему звук недоступний");
    return;
  }
  const name = `${fileName(meme)}.${kind === "video" ? meme.videoExt : meme.audioExt}`;
  // Supabase віддає файл саме на скачування, якщо додати ?download=
  const href = src.includes("/storage/v1/object/public/") ? `${src}?download=${encodeURIComponent(name)}` : src;
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (meme.real) supabaseBrowser()?.rpc("count_download", { p_meme: meme.id }).then(() => {});
  toast(kind === "video" ? "Відео скачується" : "Звук скачується");
}

// Поділитися: на телефоні — системне меню, на компʼютері — копіюємо посилання
export async function shareMeme(meme: Meme, toast: (t: string) => void) {
  const url = `${window.location.origin}/meme/${meme.id}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: meme.title, text: "Шо за мем?!", url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast("Посилання скопійовано");
  } catch {
    // людина закрила меню — нічого не робимо
  }
}
