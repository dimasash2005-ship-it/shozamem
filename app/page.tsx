import Feed from "@/components/Feed";
import BottomNav from "@/components/BottomNav";
import { getFeedMemes } from "@/lib/db";

export const revalidate = 30; // стрічка оновлюється кожні 30 секунд

export default async function Home() {
  const memes = await getFeedMemes();
  return (
    <>
      <Feed memes={memes} />
      <BottomNav />
    </>
  );
}
