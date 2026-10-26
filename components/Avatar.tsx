/* eslint-disable @next/next/no-img-element */

// Аватар: фото, якщо є, інакше перша літера ніка
export default function Avatar({ src, name, size = 48, ring }: { src?: string | null; name?: string | null; size?: number; ring?: boolean }) {
  const letter = (name?.replace("@", "")[0] ?? "?").toUpperCase();
  return (
    <span
      className={`avatar-any ${ring ? "ring" : ""}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" /> : letter}
    </span>
  );
}
