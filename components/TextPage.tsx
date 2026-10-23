import Link from "next/link";
import { IconBack } from "./Icons";

export default function TextPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="screen text-page">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/profile" className="icon-btn" aria-label="Назад"><IconBack /></Link>
        <h1 className="h1 display" style={{ fontSize: 22 }}>{title}</h1>
      </div>
      <p className="muted" style={{ margin: 0 }}>Оновлено: {updated}</p>
      {children}
    </main>
  );
}
