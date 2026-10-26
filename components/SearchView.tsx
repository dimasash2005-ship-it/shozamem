"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES, formatCount, formatDuration, type Category, type Meme } from "@/lib/memes";
import { IconFilter, IconFire, IconSearch } from "./Icons";

type TypeF = "all" | "video" | "sound";
type DurF = "any" | "short" | "mid" | "long";
type SortF = "pop" | "new";

const WEEK = 7 * 24 * 3600 * 1000;

function Chips<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[] }) {
  return (
    <div className="chips">
      {options.map((o) => (
        <button key={o.id} type="button" className="chip" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function MemeTile({ m, tall }: { m: Meme; tall?: boolean }) {
  const bg = m.thumb
    ? `linear-gradient(to top, rgba(14,14,16,0.92), rgba(14,14,16,0) 55%), center / cover no-repeat url(${m.thumb})`
    : `linear-gradient(to top, rgba(14,14,16,0.6), rgba(14,14,16,0) 60%), ${m.color}`;
  return (
    <Link href={`/meme/${m.id}`} className="mtile" style={{ background: bg, height: tall ? 230 : 170 }}>
      <span className="mtile-top">
        <span className="pill pill-glass">{m.type === "sound" ? "Звук" : "Відео"} · {formatDuration(m.seconds)}</span>
      </span>
      <span className="mtile-bottom">
        <strong>{m.title}</strong>
        <span>{formatCount(m.downloads)} скачувань</span>
      </span>
    </Link>
  );
}

export default function SearchView({ memes }: { memes: Meme[] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TypeF>("all");
  const [dur, setDur] = useState<DurF>("any");
  const [sort, setSort] = useState<SortF>("pop");
  const [cat, setCat] = useState<Category | "all">("all");

  const filtersOn = type !== "all" || dur !== "any" || sort !== "pop" || cat !== "all";
  const searching = q.trim().length > 0 || filtersOn;

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return memes
      .filter(
        (m) =>
          (type === "all" || m.type === type) &&
          (cat === "all" || m.category === cat) &&
          (dur === "any" ||
            (dur === "short" && m.seconds <= 5) ||
            (dur === "mid" && m.seconds > 5 && m.seconds <= 15) ||
            (dur === "long" && m.seconds > 15)) &&
          (!s ||
            m.title.toLowerCase().includes(s) ||
            m.caption.toLowerCase().includes(s) ||
            (m.username ?? m.author).toLowerCase().includes(s.replace("@", ""))),
      )
      .sort((a, b) => (sort === "pop" ? b.downloads - a.downloads : b.createdAt - a.createdAt));
  }, [memes, q, type, dur, sort, cat]);

  // Топ тижня: найпопулярніші за останні 7 днів (якщо таких мало — за весь час)
  const top = useMemo(() => {
    const newest = Math.max(...memes.map((m) => m.createdAt), 0);
    const score = (m: Meme) => m.likes * 2 + m.downloads;
    const recent = memes.filter((m) => newest - m.createdAt < WEEK);
    const pool = recent.length >= 4 ? recent : memes;
    return [...pool].sort((a, b) => score(b) - score(a)).slice(0, 6);
  }, [memes]);

  const sounds = useMemo(() => memes.filter((m) => m.audio || m.type === "sound").sort((a, b) => b.downloads - a.downloads).slice(0, 6), [memes]);

  const left = results.filter((_, i) => i % 2 === 0);
  const right = results.filter((_, i) => i % 2 === 1);

  return (
    <main className="screen">
      <h1 className="h1 display">Шо шукаєм?</h1>

      <div className="search-row">
        <label className="search-box">
          <IconSearch />
          <span className="sr-only">Пошук мемів</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Фраза, герой, звук або @автор" />
        </label>
        <button
          className={`icon-btn filter-btn ${open || filtersOn ? "on" : ""}`}
          aria-label="Фільтри"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <IconFilter />
        </button>
      </div>

      {open && (
        <div className="filters">
          <span className="label-caps">Тип</span>
          <Chips value={type} onChange={setType} options={[{ id: "all", label: "Усе" }, { id: "video", label: "Відео" }, { id: "sound", label: "Звуки" }]} />
          <span className="label-caps">Тривалість</span>
          <Chips value={dur} onChange={setDur} options={[{ id: "any", label: "Будь-яка" }, { id: "short", label: "до 5 с" }, { id: "mid", label: "5–15 с" }, { id: "long", label: "15+ с" }]} />
          <span className="label-caps">Спочатку</span>
          <Chips value={sort} onChange={setSort} options={[{ id: "pop", label: "Популярні" }, { id: "new", label: "Нові" }]} />
          {filtersOn && (
            <button
              className="btn btn-link"
              onClick={() => {
                setType("all");
                setDur("any");
                setSort("pop");
                setCat("all");
              }}
            >
              Скинути фільтри
            </button>
          )}
        </div>
      )}

      <div className="chips-scroll">
        <Chips value={cat} onChange={setCat} options={CATEGORIES} />
      </div>

      {!searching ? (
        <>
          <div className="section-head">
            <h2 className="h2"><IconFire /> Топ тижня</h2>
          </div>
          <div className="hscroll">
            {top.map((m) => (
              <div key={m.id} style={{ flex: "0 0 150px" }}>
                <MemeTile m={m} tall />
              </div>
            ))}
          </div>

          {sounds.length > 0 && (
            <>
              <div className="section-head">
                <h2 className="h2">Популярні звуки</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sounds.map((m, i) => (
                  <Link key={m.id} href={`/meme/${m.id}`} className="result">
                    <span className="rank">{i + 1}</span>
                    <span className="result-text">
                      <strong>{m.title}</strong>
                      <span className="muted" style={{ fontSize: 13 }}>{formatDuration(m.seconds)} · {formatCount(m.downloads)} скачувань</span>
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className="section-head">
            <h2 className="h2">Усі меми</h2>
          </div>
        </>
      ) : (
        <span className="muted">Знайдено: {results.length}</span>
      )}

      {results.length === 0 ? (
        <div className="empty">
          <strong>Такого мему ще нема</strong>
          <span className="muted">Спробуй інше слово або завантаж першим</span>
          <Link href="/upload" className="btn btn-yellow">Завантажити мем</Link>
        </div>
      ) : (
        <div className="masonry">
          <div>{left.map((m, i) => <MemeTile key={m.id} m={m} tall={i % 2 === 0} />)}</div>
          <div>{right.map((m, i) => <MemeTile key={m.id} m={m} tall={i % 2 === 1} />)}</div>
        </div>
      )}
    </main>
  );
}
