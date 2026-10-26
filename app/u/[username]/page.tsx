import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthor } from "@/lib/db";
import { formatCount } from "@/lib/memes";
import AuthorFollow from "@/components/AuthorFollow";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import { IconBack } from "@/components/Icons";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `@${decodeURIComponent(username)} — SHO ZA MEM` };
}

export default async function AuthorPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const author = await getAuthor(decodeURIComponent(username));
  if (!author) notFound();

  const downloads = author.memes.reduce((s, m) => s + m.downloads, 0);
  const likes = author.memes.reduce((s, m) => s + m.likes, 0);

  return (
    <>
      <main className="screen">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" className="icon-btn" aria-label="Назад"><IconBack /></Link>
          <span className="muted">Автор</span>
        </div>

        <section className="profile-card" style={{ flexDirection: "column", alignItems: "stretch", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar src={author.avatar} name={author.username} size={76} ring />
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 22 }}>{author.displayName || `@${author.username}`}</h1>
              {author.displayName && <span className="muted" style={{ fontSize: 14 }}>@{author.username}</span>}
              <span className="muted" style={{ fontSize: 13 }}>
                з нами з {new Date(author.createdAt).toLocaleDateString("uk-UA", { month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
          <AuthorFollow authorId={author.id} username={author.username} followers={author.followers} />
        </section>

        <div className="grid-3">
          <div className="stat"><b>{author.memes.length}</b><span className="muted" style={{ fontSize: 12 }}>мемів</span></div>
          <div className="stat"><b>{formatCount(downloads)}</b><span className="muted" style={{ fontSize: 12 }}>скачувань</span></div>
          <div className="stat"><b>{formatCount(likes)}</b><span className="muted" style={{ fontSize: 12 }}>вподобань</span></div>
        </div>

        {author.memes.length === 0 ? (
          <div className="empty">
            <strong>Ще жодного мему</strong>
            <span className="muted">Тут зʼявляться меми @{author.username}</span>
          </div>
        ) : (
          <div className="grid-3">
            {author.memes.map((m) => (
              <Link
                key={m.id}
                href={`/meme/${m.id}`}
                className="tile"
                style={{
                  height: 150,
                  background: m.thumb
                    ? `linear-gradient(to top, rgba(14,14,16,0.85), rgba(14,14,16,0) 60%), center / cover no-repeat url(${m.thumb})`
                    : m.color,
                }}
              >
                {m.title}
              </Link>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
