import { publicUrl } from "./supabase";

export type MemeType = "video" | "sound";
export type Category = "react" | "study" | "cats" | "cringe";

export type Meme = {
  id: string;
  title: string;
  caption: string;
  author: string;
  credit: string | null;
  type: MemeType;
  seconds: number;
  category: Category;
  likes: number;
  downloads: number;
  createdAt: number;
  color: string;
  video: string | null;
  audio: string | null;
  thumb: string | null;
  videoExt: string;
  audioExt: string;
  real: boolean; // true = мем з бази, false = тестовий
};

export const CATEGORIES: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "Усі" },
  { id: "react", label: "Реакції" },
  { id: "study", label: "Пари й сесія" },
  { id: "cats", label: "Котики" },
  { id: "cringe", label: "Кринж" },
];

export const CATEGORY_LABEL: Record<Category, string> = {
  react: "Реакції",
  study: "Пари й сесія",
  cats: "Котики",
  cringe: "Кринж",
};

const PALETTE = ["#1E2A4A", "#4A2A1E", "#2A3A1E", "#3A1E4A", "#1E3A3A", "#3A2A1E", "#2A1E3A"];

export function pickColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

const NOW = 1761200000000;
const HOUR = 3600000;

type TestSeed = { id: string; title: string; caption: string; author: string; type: MemeType; seconds: number; category: Category; likes: number; downloads: number; ago: number };

const SEEDS: TestSeed[] = [
  { id: "para-8", title: "Коли пара о 8:00", caption: "коли пара о 8:00, а світла нема", author: "@автор_мему", type: "video", seconds: 7, category: "study", likes: 2400, downloads: 9100, ago: 5 },
  { id: "kit", title: "Кіт, який усе зрозумів", caption: "кіт, який усе зрозумів", author: "@котомем", type: "video", seconds: 4, category: "cats", likes: 5100, downloads: 7100, ago: 2 },
  { id: "susid", title: "Сусід і перфоратор", caption: "сусід о 7:00 у суботу", author: "@сусідський", type: "video", seconds: 9, category: "cringe", likes: 1800, downloads: 4200, ago: 4 },
  { id: "ocinky", title: "Мама побачила оцінки", caption: "мама побачила оцінки", author: "@студент_мем", type: "video", seconds: 5, category: "study", likes: 3300, downloads: 5600, ago: 6 },
  { id: "pryikhaly", title: "«Ну все, приїхали»", caption: "ну все, приїхали", author: "@звуки_ua", type: "sound", seconds: 3, category: "react", likes: 6700, downloads: 18000, ago: 1 },
  { id: "pauza", title: "Драматична пауза", caption: "драматична пауза", author: "@звуки_ua", type: "sound", seconds: 2, category: "react", likes: 2900, downloads: 11000, ago: 3 },
  { id: "smikh", title: "Сміх за кадром", caption: "сміх за кадром", author: "@звуки_ua", type: "sound", seconds: 4, category: "react", likes: 1500, downloads: 9000, ago: 7 },
  { id: "gurtozhytok", title: "Історія про гуртожиток", caption: "історія про гуртожиток", author: "@студент_мем", type: "video", seconds: 18, category: "study", likes: 900, downloads: 1200, ago: 8 },
];

// Тестові меми — показуються, поки в базі ще немає опублікованих
export const MEMES: Meme[] = SEEDS.map((s) => ({
  id: s.id,
  title: s.title,
  caption: s.caption,
  author: s.author,
  credit: null,
  type: s.type,
  seconds: s.seconds,
  category: s.category,
  likes: s.likes,
  downloads: s.downloads,
  createdAt: NOW - s.ago * HOUR,
  color: pickColor(s.id),
  video: null,
  audio: null,
  thumb: null,
  videoExt: "mp4",
  audioExt: "mp3",
  real: false,
}));

function ext(path: string | null | undefined, fallback: string) {
  if (!path) return fallback;
  const m = path.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : fallback;
}

// Рядок з бази → мем для інтерфейсу
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToMeme(r: any): Meme {
  const username = r.profiles?.username ? `@${r.profiles.username}` : "@анонім";
  return {
    id: r.id,
    title: r.title,
    caption: String(r.title).toLowerCase(),
    author: username,
    credit: r.author_credit ?? null,
    type: r.kind === "sound" ? "sound" : "video",
    seconds: r.seconds,
    category: r.category,
    likes: r.likes_count ?? 0,
    downloads: r.downloads_count ?? 0,
    createdAt: Date.parse(r.created_at),
    color: pickColor(r.id),
    video: publicUrl(r.video_path),
    audio: publicUrl(r.audio_path),
    thumb: publicUrl(r.thumb_path),
    videoExt: ext(r.video_path, "mp4"),
    audioExt: ext(r.audio_path, "wav"),
    real: true,
  };
}

export function formatCount(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".", ",").replace(",0", "") + " тис.";
  return String(n);
}

export function formatDuration(s: number) {
  return `0:${String(s).padStart(2, "0")}`;
}

export function fileName(meme: Meme) {
  return meme.title.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").toLowerCase() || "mem";
}
