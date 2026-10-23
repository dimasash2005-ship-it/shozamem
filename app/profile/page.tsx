import ProfileView from "@/components/ProfileView";
import BottomNav from "@/components/BottomNav";

export const metadata = { title: "Кабінет — SHO ZA MEM" };

export default function ProfilePage() {
  return (
    <>
      <ProfileView />
      <BottomNav />
    </>
  );
}
