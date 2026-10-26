"use client";

import { useEffect, useState } from "react";
import type { Meme } from "@/lib/memes";
import { shareMeme } from "@/lib/actions";
import DownloadSheet from "./DownloadSheet";
import CommentsSheet from "./CommentsSheet";
import { supabaseBrowser } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useToast } from "./Toast";
import { IconBookmark, IconShare } from "./Icons";

export function SaveButton({ meme }: { meme: Meme }) {
  const toast = useToast();
  const user = useUser();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !user || !meme.real) return;
    sb.from("saves")
      .select("meme_id")
      .eq("user_id", user.id)
      .eq("meme_id", meme.id)
      .maybeSingle()
      .then(({ data }) => setSaved(Boolean(data)));
  }, [user, meme]);

  const toggle = async () => {
    if (!meme.real) {
      setSaved(!saved);
      toast(saved ? "Прибрано зі збереженого" : "Збережено (тестовий мем)");
      return;
    }
    const sb = supabaseBrowser();
    if (!sb || !user) return toast("Увійди в кабінет, щоб зберігати меми");
    const was = saved;
    setSaved(!was);
    const { error } = was
      ? await sb.from("saves").delete().eq("user_id", user.id).eq("meme_id", meme.id)
      : await sb.from("saves").insert({ user_id: user.id, meme_id: meme.id });
    if (error) {
      setSaved(was);
      toast("Не вийшло, спробуй ще раз");
    } else toast(was ? "Прибрано зі збереженого" : "Збережено в кабінет");
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button className="icon-btn" aria-label="Поділитися" onClick={() => shareMeme(meme, toast)}>
        <IconShare size={20} />
      </button>
      <button className="icon-btn" aria-label="Зберегти" aria-pressed={saved} style={saved ? { color: "var(--yellow)" } : undefined} onClick={toggle}>
        <IconBookmark />
      </button>
    </div>
  );
}

export default function MemeActions({ meme }: { meme: Meme }) {
  const toast = useToast();
  const [dl, setDl] = useState<"video" | "audio" | null>(null);
  const [comments, setComments] = useState(false);
  const [count, setCount] = useState(meme.comments);
  return (
    <>
      <div className="grid-2">
        <button className="btn btn-yellow btn-stack" onClick={() => setDl("video")} disabled={!meme.video && meme.real}>
          Відео
          <small>переглянути і скачати</small>
        </button>
        <button className="btn btn-blue btn-stack" onClick={() => setDl("audio")} disabled={!meme.audio && meme.real}>
          Звук
          <small>послухати і скачати</small>
        </button>
      </div>
      <button className="btn btn-ghost btn-block" onClick={() => setComments(true)}>
        Коментарі{count > 0 ? ` · ${count}` : ""}
      </button>
      <button className="btn btn-ghost btn-block" style={{ borderStyle: "dashed" }} onClick={() => toast("Обличчя на мемі — скоро!")}>
        Зробити свою версію з обличчям
        <span style={{ fontSize: 12, background: "var(--text)", color: "#0e0e10", padding: "3px 10px", borderRadius: 999 }}>Скоро</span>
      </button>
      <DownloadSheet meme={meme} open={dl !== null} start={dl ?? "video"} onClose={() => setDl(null)} />
      <CommentsSheet meme={meme} open={comments} onClose={() => setComments(false)} onCount={(_, d) => setCount((c) => c + d)} />
    </>
  );
}

export function ReportButton({ meme }: { meme: Meme }) {
  const toast = useToast();
  const user = useUser();
  const [sent, setSent] = useState(false);

  const report = async () => {
    if (!meme.real) return toast("Дякуємо! Це тестовий мем");
    const sb = supabaseBrowser();
    if (!sb || !user) return toast("Увійди в кабінет, щоб поскаржитись");
    const { error } = await sb.from("reports").insert({ meme_id: meme.id, user_id: user.id, reason: "not_meme_or_violation" });
    if (error && error.code === "23505") toast("Ти вже скаржився на цей мем");
    else if (error) toast("Не вийшло, спробуй ще раз");
    else {
      setSent(true);
      toast("Дякуємо! Перевіримо цей мем");
    }
  };

  return (
    <button
      className="btn"
      style={{ background: "transparent", color: "var(--muted)", fontWeight: 500, fontSize: 14, alignSelf: "center" }}
      disabled={sent}
      onClick={report}
    >
      {sent ? "Скаргу надіслано" : "Поскаржитись на мем"}
    </button>
  );
}
