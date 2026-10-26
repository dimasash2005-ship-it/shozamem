"use client";

import { useEffect, useState } from "react";
import { formatDuration, type Meme } from "@/lib/memes";
import { downloadFile } from "@/lib/actions";
import { useToast } from "./Toast";
import Sheet from "./Sheet";
import { IconDownload, IconMusic } from "./Icons";

type Kind = "video" | "audio";

// Спершу переглянь або послухай — потім скачуй
export default function DownloadSheet({ meme, open, onClose, start = "video" }: { meme: Meme | null; open: boolean; onClose: () => void; start?: Kind }) {
  const toast = useToast();
  const [kind, setKind] = useState<Kind>(start);

  useEffect(() => {
    if (!open || !meme) return;
    setKind(start === "video" && !meme.video ? "audio" : start);
  }, [open, meme, start]);

  if (!meme) return null;
  const hasVideo = Boolean(meme.video);
  const hasAudio = Boolean(meme.audio);

  return (
    <Sheet open={open} onClose={onClose} title="Скачати мем">
      <div className="segmented" style={{ gridTemplateColumns: "1fr 1fr" }} role="group" aria-label="Що скачати">
        <button aria-pressed={kind === "video"} disabled={!hasVideo} onClick={() => setKind("video")}>Відео</button>
        <button aria-pressed={kind === "audio"} disabled={!hasAudio} onClick={() => setKind("audio")}>Звук</button>
      </div>

      <div className="dl-preview" style={{ background: meme.color }}>
        {kind === "video" && meme.video ? (
          <video key={meme.video} src={meme.video} poster={meme.thumb ?? undefined} controls autoPlay playsInline />
        ) : kind === "audio" && meme.audio ? (
          <div className="dl-audio">
            <span className="dl-audio-icon"><IconMusic size={34} /></span>
            <strong>{meme.title}</strong>
            <audio key={meme.audio} src={meme.audio} controls autoPlay />
          </div>
        ) : (
          <div className="dl-audio">
            <strong>{meme.caption}</strong>
            <span className="muted">{meme.real ? "Цього формату для мему немає" : "Тестовий мем — файлу немає"}</span>
          </div>
        )}
      </div>

      <p className="muted" style={{ margin: 0, textAlign: "center", fontSize: 13 }}>
        {kind === "video" ? `${meme.videoExt.toUpperCase()} · ${formatDuration(meme.seconds)}` : `${meme.audioExt.toUpperCase()} · ${formatDuration(meme.seconds)} · ідеально для монтажу`}
      </p>

      <button
        className={`btn btn-block ${kind === "video" ? "btn-yellow" : "btn-blue"}`}
        onClick={() => {
          downloadFile(meme, kind, toast);
          if ((kind === "video" && hasVideo) || (kind === "audio" && hasAudio)) onClose();
        }}
      >
        <IconDownload size={20} /> {kind === "video" ? "Скачати відео" : "Скачати звук"}
      </button>
    </Sheet>
  );
}
