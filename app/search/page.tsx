import SearchView from "@/components/SearchView";
import BottomNav from "@/components/BottomNav";
import { getFeedMemes } from "@/lib/db";

export const metadata = { title: "Пошук — SHO ZA MEM" };
export const revalidate = 30;

export default async function SearchPage() {
  const memes = await getFeedMemes();
  return (
    <>
      <SearchView memes={memes} />
      <BottomNav />
    </>
  );
}
