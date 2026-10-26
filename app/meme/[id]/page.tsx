import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_LABEL, formatCount, formatDuration } from "@/lib/memes";
import { getFeedMemes, getMemeById } from "@/lib/db";
import MemeActions, { ReportButton, SaveButton } from "@/components/MemeActions";
import { IconBack } from "@/components/Icons";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await getMemeById(id);
  return {
    title: m ? `${m.title} — SHO ZA MEM` : "SHO ZA MEM",
    openGraph: m?.thumb ? { images: [m.thumb] } : undefined,
  };
}

export default async function MemePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meme = await getMemeById(id);
  if (!meme) notFound();

  const all = await getFeedMemes();
  const others = all.filter((m) => m.id !== meme.id);
  const similar = [...others.filter((m) => m.category === meme.category), ...others.filter((m) => m.category !== meme.category)].slice(0, 3);

  return (
    <main className="screen">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" className="icon-btn" aria-label="Назад">
          <IconBack />
        </Link>
        <SaveButton meme={meme} />
      </div>

      <div className="preview" style={{ background: meme.color }}>
        {meme.video ? (
          <video src={meme.video} poster={meme.thumb ?? undefined} controls playsInline />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", position: "relative" }}>
            <span className="display" style={{ fontSize: 26, lineHeight: 1.1 }}>{meme.caption}</span>
            {meme.audio && <audio src={meme.audio} controls preload="none" />}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>{meme.title}</h1>
        <span className="muted">
          {meme.username ? <Link href={`/u/${meme.username}`} className="link">@{meme.username}</Link> : meme.author} · {CATEGORY_LABEL[meme.category]} · {formatDuration(meme.seconds)} · {formatCount(meme.downloads)} завантажень
        </span>
        {meme.credit && <span className="muted">Автор оригіналу: {meme.credit}</span>}
      </div>

      <MemeActions meme={meme} />

      {similar.length > 0 && (
        <>
          <h2 className="h2">Схожі меми</h2>
          <div className="grid-3">
            {similar.map((m) => (
              <Link
                key={m.id}
                href={`/meme/${m.id}`}
                className="tile"
                style={{ background: m.thumb ? `linear-gradient(to top, rgba(14,14,16,0.85), rgba(14,14,16,0) 60%), center / cover no-repeat url(${m.thumb})` : m.color }}
              >
                {m.title}
              </Link>
            ))}
          </div>
        </>
      )}

      <ReportButton meme={meme} />
    </main>
  );
}
