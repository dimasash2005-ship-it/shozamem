import { MEMES, rowToMeme, type Meme } from "./memes";
import { publicUrl, supabaseServer } from "./supabase";

const SELECT = "*, profiles!memes_user_id_fkey(username, display_name, avatar_path)";

// Опубліковані меми для стрічки і пошуку. Якщо в базі ще пусто — тестові.
export async function getFeedMemes(): Promise<Meme[]> {
  const sb = supabaseServer();
  if (!sb) return MEMES;
  const { data, error } = await sb
    .from("memes")
    .select(SELECT)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error || !data || data.length === 0) return MEMES;
  return data.map(rowToMeme);
}

export async function getMemeById(id: string): Promise<Meme | null> {
  const test = MEMES.find((m) => m.id === id);
  if (test) return test;
  const sb = supabaseServer();
  if (!sb || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await sb.from("memes").select(SELECT).eq("id", id).eq("status", "approved").maybeSingle();
  return data ? rowToMeme(data) : null;
}

export type Author = {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  createdAt: number;
  followers: number;
  memes: Meme[];
};

// Сторінка автора: профіль, кількість підписників і його опубліковані меми
export async function getAuthor(username: string): Promise<Author | null> {
  const sb = supabaseServer();
  if (!sb) return null;
  const { data: p } = await sb.from("profiles").select("id, username, display_name, avatar_path, created_at").eq("username", username).maybeSingle();
  if (!p) return null;
  const [{ data: rows }, { count }] = await Promise.all([
    sb.from("memes").select(SELECT).eq("user_id", p.id).eq("status", "approved").order("created_at", { ascending: false }).limit(200),
    sb.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", p.id),
  ]);
  return {
    id: p.id,
    username: p.username,
    displayName: p.display_name ?? null,
    avatar: publicUrl(p.avatar_path),
    createdAt: Date.parse(p.created_at),
    followers: count ?? 0,
    memes: (rows ?? []).map(rowToMeme),
  };
}
