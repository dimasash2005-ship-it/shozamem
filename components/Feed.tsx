"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORY_LABEL, formatCount, formatDuration, type Meme } from "@/lib/memes";
import { shareMeme } from "@/lib/actions";
import { supabaseBrowser } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useFollows } from "@/lib/useFollows";
import { useToast } from "./Toast";
import Logo from "./Logo";
import Avatar from "./Avatar";
import MoreMenu from "./MoreMenu";
import DownloadSheet from "./DownloadSheet";
import CommentsSheet from "./CommentsSheet";
import { IconCheck, IconDownload, IconHeart, IconPlus, IconShare, IconUp, IconVolumeOff, IconVolumeOn } from "./Icons";

type Tab = "hot" | "new" | "follow";

function IconComment({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
    </svg>
  );
}

export default function Feed({ memes }: { memes: Meme[] }) {
  const toast = useToast();
  const user = useUser();
  const { following, toggle: toggleFollow } = useFollows(user);
  const [tab, setTab] = useState<Tab>("hot");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [initial, setInitial] = useState<Record<string, boolean>>({});
  const [commentDelta, setCommentDelta] = useState<Record<string, number>>({});
  const [muted, setMuted] = useState(true);
  const [burst, setBurst] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [dlMeme, setDlMeme] = useState<Meme | null>(null);
  const [comMeme, setComMeme] = useState<Meme | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const lastTap = useRef<{ id: string; t: number } | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const list = useMemo(() => {
    if (tab === "follow") {
      return memes.filter((m) => m.userId && following.has(m.userId)).sort((a, b) => b.createdAt - a.createdAt);
    }
    return [...memes].sort((a, b) =>
      tab === "hot" ? b.likes + b.downloads / 4 + b.comments * 2 - (a.likes + a.downloads / 4 + a.comments * 2) : b.createdAt - a.createdAt,
    );
  }, [memes, tab, following]);

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

  // Який мем зараз на екрані: він грає, сусідні — готуються заздалегідь
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const el = e.target as HTMLElement;
          const v = el.querySelector("video");
          const a = el.querySelector("audio");
          if (e.isIntersecting) {
            setActive(Number(el.dataset.index));
            v?.play().catch(() => {});
          } else {
            v?.pause();
            if (a && !a.paused) {
              a.pause();
              setPlayingAudio(null);
            }
          }
        });
      },
      { root, threshold: 0.65 },
    );
    root.querySelectorAll(".slide").forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [list]);

  useEffect(() => {
    scroller.current?.querySelectorAll("video").forEach((v) => (v.muted = muted));
  }, [muted, list, active]);

  const pickTab = (t: Tab) => {
    if (t === "follow" && user === null) toast("Увійди, щоб бачити меми авторів, на яких підписаний");
    setTab(t);
    setActive(0);
    scroller.current?.scrollTo({ top: 0 });
  };

  const setLike = async (m: Meme, value: boolean) => {
    const was = !!liked[m.id];
    if (was === value) return;
    if (!m.real) {
      setLiked((l) => ({ ...l, [m.id]: value }));
      return;
    }
    const sb = supabaseBrowser();
    if (!sb || !user) {
      toast("Увійди в кабінет, щоб ставити лайки");
      return;
    }
    setLiked((l) => ({ ...l, [m.id]: value }));
    const { error } = value
      ? await sb.from("likes").insert({ user_id: user.id, meme_id: m.id })
      : await sb.from("likes").delete().eq("user_id", user.id).eq("meme_id", m.id);
    if (error) {
      setLiked((l) => ({ ...l, [m.id]: was }));
      toast("Не вийшло, спробуй ще раз");
    }
  };

  // Один тап — звук, подвійний — лайк
  const onMediaTap = (m: Meme) => {
    const now = Date.now();
    if (lastTap.current && lastTap.current.id === m.id && now - lastTap.current.t < 280) {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      lastTap.current = null;
      setBurst(m.id);
      setTimeout(() => setBurst(null), 700);
      setLike(m, true);
      return;
    }
    lastTap.current = { id: m.id, t: now };
    tapTimer.current = setTimeout(() => {
      if (m.video) setMuted((x) => !x);
    }, 280);
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

  const follow = async (m: Meme) => {
    if (!m.userId) return toast("Це тестовий мем");
    const err = await toggleFollow(m.userId);
    if (err) toast(err);
    else toast(following.has(m.userId) ? "Ти відписався" : `Тепер ти стежиш за @${m.username}`);
  };

  return (
    <main className="feed">
      <div className="feed-top">
        <Logo size={16} />
        <div className="tabs" role="group" aria-label="Стрічка">
          <button aria-pressed={tab === "hot"} onClick={() => pickTab("hot")}>Гаряче</button>
          <button aria-pressed={tab === "new"} onClick={() => pickTab("new")}>Нове</button>
          <button aria-pressed={tab === "follow"} onClick={() => pickTab("follow")}>Підписки</button>
        </div>
        <MoreMenu />
      </div>

      {list.length === 0 ? (
        <div className="feed-empty">
          <div className="empty">
            <strong>{user ? "Тут поки порожньо" : "Увійди, щоб бачити підписки"}</strong>
            <span className="muted">
              {user ? "Підпишись на авторів — тисни «+» біля їхньої аватарки в стрічці" : "Підписуйся на авторів, і їхні меми зʼявлятимуться тут"}
            </span>
            <button className="btn btn-yellow" onClick={() => pickTab("hot")}>До гарячих мемів</button>
          </div>
        </div>
      ) : (
        <div className="feed-scroll" ref={scroller}>
          {list.map((m, i) => {
            const isLiked = !!liked[m.id];
            const likes = m.likes + (isLiked ? 1 : 0) - (initial[m.id] ? 1 : 0);
            const comments = m.comments + (commentDelta[m.id] ?? 0);
            const isFollowing = !!m.userId && following.has(m.userId);
            const mine = !!user && m.userId === user.id;
            const near = Math.abs(i - active) <= 1;
            return (
              <section key={m.id} className="slide" data-index={i} style={{ background: m.color }} aria-label={m.title}>
                {/* Розмита підкладка: будь-яке відео гарно виглядає на будь-якому екрані */}
                {m.thumb && <div className="slide-backdrop" style={{ backgroundImage: `url(${m.thumb})` }} aria-hidden="true" />}

                <div className="slide-media" onClick={() => onMediaTap(m)}>
                  {m.video ? (
                    <video
                      className={ready[m.id] ? "ready" : ""}
                      src={near ? m.video : undefined}
                      poster={m.thumb ?? undefined}
                      muted
                      loop
                      playsInline
                      preload={near ? "auto" : "none"}
                      onLoadedData={() => setReady((r) => (r[m.id] ? r : { ...r, [m.id]: true }))}
                      onTimeUpdate={(e) => {
                        const v = e.currentTarget;
                        const bar = v.closest(".slide")?.querySelector<HTMLElement>(".progress > span");
                        if (bar && v.duration) bar.style.transform = `scaleX(${v.currentTime / v.duration})`;
                      }}
                    />
                  ) : (
                    <div className="slide-text">
                      <span className="slide-caption">{m.caption}</span>
                      {m.audio ? (
                        <>
                          <audio id={`audio-${m.id}`} src={m.audio} preload="none" />
                          <button
                            className="btn btn-yellow btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAudio(m.id);
                            }}
                          >
                            {playingAudio === m.id ? "Пауза" : "Слухати звук"}
                          </button>
                        </>
                      ) : (
                        <span className="muted">[тут грає мем]</span>
                      )}
                    </div>
                  )}
                  {burst === m.id && (
                    <span className="heart-burst" aria-hidden="true"><IconHeart size={110} /></span>
                  )}
                </div>

                {m.video && (
                  <button className="mute-btn" aria-label={muted ? "Увімкнути звук" : "Вимкнути звук"} onClick={() => setMuted(!muted)}>
                    {muted ? <IconVolumeOff size={18} /> : <IconVolumeOn size={18} />}
                  </button>
                )}

                <div className="rail">
                  {m.username && (
                    <div className="rail-author">
                      <Link href={`/u/${m.username}`} aria-label={`Профіль @${m.username}`}>
                        <Avatar src={m.avatar} name={m.username} size={44} ring />
                      </Link>
                      {!mine && (
                        <button className={`follow-dot ${isFollowing ? "on" : ""}`} aria-label={isFollowing ? "Відписатися" : "Підписатися"} onClick={() => follow(m)}>
                          {isFollowing ? <IconCheck size={11} /> : <IconPlus size={11} />}
                        </button>
                      )}
                    </div>
                  )}
                  <button className={isLiked ? "liked" : ""} aria-label="Подобається" aria-pressed={isLiked} onClick={() => setLike(m, !isLiked)}>
                    <IconHeart size={22} />
                  </button>
                  <span className="label">{formatCount(Math.max(likes, 0))}</span>
                  <button aria-label="Коментарі" onClick={() => setComMeme(m)}>
                    <IconComment />
                  </button>
                  <span className="label">{formatCount(Math.max(comments, 0))}</span>
                  <button className="yellow" aria-label="Скачати" onClick={() => setDlMeme(m)}>
                    <IconDownload size={22} />
                  </button>
                  <span className="label">Скачати</span>
                  <button aria-label="Поділитися" onClick={() => shareMeme(m, toast)}>
                    <IconShare size={20} />
                  </button>
                </div>

                <div className="slide-info">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {m.username ? (
                      <Link href={`/u/${m.username}`} className="author-link">{m.displayName ?? `@${m.username}`}</Link>
                    ) : (
                      <span className="author-link">{m.author}</span>
                    )}
                    <span className="pill pill-glass">{CATEGORY_LABEL[m.category]}</span>
                  </div>
                  <Link href={`/meme/${m.id}`} className="title">{m.title}</Link>
                  <span className="meta">
                    {formatDuration(m.seconds)} · {formatCount(m.downloads)} скачувань{m.credit ? ` · автор: ${m.credit}` : ""}
                  </span>
                  {i === 0 && (
                    <span className="hint">
                      <IconUp /> гортай вгору · подвійний тап — лайк
                    </span>
                  )}
                </div>

                {m.video && <div className="progress" aria-hidden="true"><span /></div>}
              </section>
            );
          })}
        </div>
      )}

      <DownloadSheet meme={dlMeme} open={!!dlMeme} onClose={() => setDlMeme(null)} />
      <CommentsSheet
        meme={comMeme}
        open={!!comMeme}
        onClose={() => setComMeme(null)}
        onCount={(id, d) => setCommentDelta((c) => ({ ...c, [id]: (c[id] ?? 0) + d }))}
      />
    </main>
  );
}
