"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatCount, formatDuration, type Meme } from "@/lib/memes";
import { downloadFile, shareMeme } from "@/lib/actions";
import { supabaseBrowser } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useToast } from "./Toast";
import Logo from "./Logo";
import { IconDownload, IconHeart, IconMusic, IconShare, IconUp } from "./Icons";

type Tab = "hot" | "new";

export default function Feed({ memes }: { memes: Meme[] }) {
  const toast = useToast();
  const user = useUser();
  const [tab, setTab] = useState<Tab>("hot");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [initial, setInitial] = useState<Record<string, boolean>>({});
  const [muted, setMuted] = useState(true);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const list = useMemo(
    () => [...memes].sort((a, b) => (tab === "hot" ? b.likes - a.likes : b.createdAt - a.createdAt)),
    [memes, tab],
  );

  // Мої лайки з бази
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !user) return;
    sb.from("likes")
      .select("meme_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!data) return;
        const map = Object.fromEntries(data.map((d) => [d.meme_id as string, true]));
        setLiked(map);
        setInitial(map);
      });
  }, [user]);

  // Грає лише мем, який зараз на екрані
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const v = e.target.querySelector("video");
          const a = e.target.querySelector("audio");
          if (e.isIntersecting) v?.play().catch(() => {});
          else {
            v?.pause();
            if (a && !a.paused) {
              a.pause();
              setPlayingAudio(null);
            }
          }
        });
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll(".slide").forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [list]);

  useEffect(() => {
    scroller.current?.querySelectorAll("video").forEach((v) => (v.muted = muted));
  }, [muted, list]);

  const pickTab = (t: Tab) => {
    setTab(t);
    scroller.current?.scrollTo({ top: 0 });
  };

  const toggleLike = async (m: Meme) => {
    const was = !!liked[m.id];
    if (!m.real) {
      setLiked({ ...liked, [m.id]: !was });
      return;
    }
    const sb = supabaseBrowser();
    if (!sb || !user) {
      toast("Увійди в кабінет, щоб ставити лайки");
      return;
    }
    setLiked({ ...liked, [m.id]: !was });
    const { error } = was
      ? await sb.from("likes").delete().eq("user_id", user.id).eq("meme_id", m.id)
      : await sb.from("likes").insert({ user_id: user.id, meme_id: m.id });
    if (error) {
      setLiked((l) => ({ ...l, [m.id]: was }));
      toast("Не вийшло, спробуй ще раз");
    }
  };

  const toggleAudio = (id: string) => {
    const el = document.getElementById(`audio-${id}`) as HTMLAudioElement | null;
    if (!el) return;
    if (el.paused) {
      el.currentTime = 0;
      el.play().catch(() => {});
      setPlayingAudio(id);
      el.onended = () => setPlayingAudio(null);
    } else {
      el.pause();
      setPlayingAudio(null);
    }
  };

  return (
    <main className="feed">
      <div className="feed-top">
        <Logo size={18} />
        <div className="tabs" role="group" aria-label="Сортування">
          <button aria-pressed={tab === "hot"} onClick={() => pickTab("hot")}>Гаряче</button>
          <button aria-pressed={tab === "new"} onClick={() => pickTab("new")}>Нове</button>
        </div>
      </div>

      <div className="feed-scroll" ref={scroller}>
        {list.map((m, i) => {
          const isLiked = !!liked[m.id];
          const likes = m.likes + (isLiked ? 1 : 0) - (initial[m.id] ? 1 : 0);
          return (
            <section key={m.id} className="slide" style={{ background: m.color }} aria-label={m.title}>
              <div className="slide-media">
                {m.video ? (
                  <>
                    <video
                      src={m.video}
                      poster={m.thumb ?? undefined}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      onClick={() => setMuted(!muted)}
                    />
                    {muted && (
                      <button className="badge" style={{ position: "absolute", top: 76, left: 16, border: "none", color: "var(--text)" }} onClick={() => setMuted(false)}>
                        Звук вимкнено — торкнись
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <span className="slide-caption">{m.caption}</span>
                    {m.audio ? (
                      <>
                        <audio id={`audio-${m.id}`} src={m.audio} preload="none" />
                        <button className="btn btn-yellow" style={{ position: "relative" }} onClick={() => toggleAudio(m.id)}>
                          {playingAudio === m.id ? "Пауза" : "Слухати звук"}
                        </button>
                      </>
                    ) : (
                      <span className="muted">[тут грає мем]</span>
                    )}
                  </>
                )}
              </div>

              <div className="rail">
                <button className={isLiked ? "liked" : ""} aria-label="Подобається" aria-pressed={isLiked} onClick={() => toggleLike(m)}>
                  <IconHeart />
                </button>
                <span className="label">{formatCount(Math.max(likes, 0))}</span>
                <button className="yellow" aria-label="Скачати відео" onClick={() => downloadFile(m, "video", toast)}>
                  <IconDownload />
                </button>
                <span className="label">Відео</span>
                <button className="blue" aria-label="Скачати звук" onClick={() => downloadFile(m, "audio", toast)}>
                  <IconMusic />
                </button>
                <span className="label">Звук</span>
                <button aria-label="Поділитися" onClick={() => shareMeme(m, toast)}>
                  <IconShare />
                </button>
              </div>

              <div className="slide-info">
                <Link href={`/meme/${m.id}`} className="title">{m.title}</Link>
                <span className="meta">{m.author} · {formatDuration(m.seconds)}</span>
                {i === 0 && (
                  <span className="muted" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <IconUp /> гортай вгору — наступний мем
                  </span>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
