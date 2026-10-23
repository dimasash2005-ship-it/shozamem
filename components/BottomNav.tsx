"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconGrid, IconPlus, IconSearch, IconUser } from "./Icons";

export default function BottomNav() {
  const path = usePathname();
  const cur = (p: string) => (path === p ? "page" : undefined);

  return (
    <nav className="nav" aria-label="Головне меню">
      <Link href="/" aria-current={cur("/")}>
        <IconGrid />
        Меми
      </Link>
      <Link href="/search" aria-current={cur("/search")}>
        <IconSearch />
        Пошук
      </Link>
      <Link href="/upload" aria-label="Додати мем">
        <span className="plus"><IconPlus /></span>
      </Link>
      <Link href="/profile" aria-current={cur("/profile")}>
        <IconUser />
        Кабінет
      </Link>
    </nav>
  );
}
