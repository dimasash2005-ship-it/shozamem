import { MEMES, rowToMeme, type Meme } from "./memes";
import { supabaseServer } from "./supabase";

const SELECT = "*, profiles!memes_user_id_fkey(username)";

// Опубліковані меми для стрічки і пошуку. Якщо в базі ще пусто — тестові.
export async function getFeedMemes(): Promise<Meme[]> {
  const sb = supabaseServer();
  if (!sb) return MEMES;
  const { data, error } = await sb
    .from("memes")
    .select(SELECT)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(200);
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
