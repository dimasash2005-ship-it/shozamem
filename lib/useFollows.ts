"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "./supabase";

// На кого підписаний поточний користувач + перемикач підписки
export function useFollows(user: User | null | undefined) {
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !user) {
      setFollowing(new Set());
      setReady(user === null);
      return;
    }
    sb.from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .then(({ data }) => {
        setFollowing(new Set((data ?? []).map((d) => d.following_id as string)));
        setReady(true);
      });
  }, [user]);

  // Повертає текст помилки або null
  const toggle = useCallback(
    async (authorId: string): Promise<string | null> => {
      const sb = supabaseBrowser();
      if (!sb || !user) return "Увійди в кабінет, щоб підписуватись";
      if (authorId === user.id) return "Це ти :)";
      const was = following.has(authorId);
      const next = new Set(following);
      if (was) next.delete(authorId);
      else next.add(authorId);
      setFollowing(next);
      const { error } = was
        ? await sb.from("follows").delete().eq("follower_id", user.id).eq("following_id", authorId)
        : await sb.from("follows").insert({ follower_id: user.id, following_id: authorId });
      if (error) {
        setFollowing(following);
        return "Не вийшло, спробуй ще раз";
      }
      return null;
    },
    [user, following],
  );

  return { following, toggle, ready };
}
