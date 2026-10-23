"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES, formatCount, formatDuration, type Category, type Meme } from "@/lib/memes";
import { IconDownload, IconFilter, IconSearch } from "./Icons";

type TypeF = "all" | "video" | "sound";
type DurF = "any" | "short" | "mid" | "long";
type SortF = "pop" | "new";

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

export default function SearchView({ memes }: { memes: Meme[] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TypeF>("all");
  const [dur, setDur] = useState<DurF>("any");
  const [sort, setSort] = useState<SortF>("pop");
  const [cat, setCat] = useState<Category | "all">("all");

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return memes.filter(
      (m) =>
        (type === "all" || m.type === type) &&
        (cat === "all" || m.category === cat) &&
        (dur === "any" ||
          (dur === "short" && m.seconds <= 5) ||
          (dur === "mid" && m.seconds > 5 && m.seconds <= 15) ||
          (dur === "long" && m.seconds > 15)) &&
        (!s || m.title.toLowerCase().includes(s) || m.caption.toLowerCase().includes(s) || m.author.toLowerCase().includes(s)),
    ).sort((a, b) => (sort === "pop" ? b.downloads - a.downloads : b.createdAt - a.createdAt));
  }, [memes, q, type, dur, sort, cat]);

  return (
    <main className="screen">
      <h1 className="h1 display">Шо шукаєм?</h1>

      <div className="search-row">
        <label className="search-box">
          <IconSearch />
          <span className="sr-only">Пошук мемів</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Фраза, герой або звук" />
        </label>
        <button
          className="icon-btn"
          style={{ width: 52, height: 52, ...(open ? { background: "var(--yellow)", color: "#0e0e10", borderColor: "var(--yellow)" } : {}) }}
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
        </div>
      )}

      <Chips value={cat} onChange={setCat} options={CATEGORIES} />

      <span className="muted">Знайдено: {results.length}</span>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {results.map((m) => (
          <Link key={m.id} href={`/meme/${m.id}`} className="result">
            <span className="thumb" style={{ background: m.thumb ? `center / cover no-repeat url(${m.thumb})` : m.color }}>{m.thumb ? "" : m.type === "sound" ? "ЗВУК" : "ВІДЕО"}</span>
            <span className="result-text">
              <strong>{m.title}</strong>
              <span className="muted" style={{ fontSize: 13 }}>
                {m.type === "sound" ? "Звук" : "Відео"} · {formatDuration(m.seconds)} · {formatCount(m.downloads)} завантажень
              </span>
            </span>
            <span className="icon-btn" aria-hidden="true" style={{ width: 42, height: 42, border: "none", background: "var(--surface-2)" }}>
              <IconDownload size={18} />
            </span>
          </Link>
        ))}
        {results.length === 0 && (
          <p className="muted" style={{ textAlign: "center", padding: "24px 8px" }}>Такого мему ще нема. Завантаж першим!</p>
        )}
      </div>
    </main>
  );
}
