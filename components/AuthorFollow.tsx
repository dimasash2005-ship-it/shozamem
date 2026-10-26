"use client";

import { useState } from "react";
import { useUser } from "@/lib/useUser";
import { useFollows } from "@/lib/useFollows";
import { useToast } from "./Toast";

export default function AuthorFollow({ authorId, username, followers }: { authorId: string; username: string; followers: number }) {
  const user = useUser();
  const toast = useToast();
  const { following, toggle } = useFollows(user);
  const [delta, setDelta] = useState(0);
  const isMe = user?.id === authorId;
  const on = following.has(authorId);

  const click = async () => {
    const err = await toggle(authorId);
    if (err) return toast(err);
    setDelta((d) => d + (on ? -1 : 1));
    toast(on ? "Ти відписався" : `Тепер ти стежиш за @${username}`);
  };

  const count = Math.max(followers + delta, 0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ flex: "1 1 auto" }}>
        <b style={{ fontSize: 18 }}>{count}</b> <span className="muted">підписників</span>
      </span>
      {!isMe && (
        <button className={`btn ${on ? "btn-ghost" : "btn-yellow"}`} style={{ minHeight: 46 }} onClick={click}>
          {on ? "Ти підписаний" : "Підписатися"}
        </button>
      )}
    </div>
  );
}
