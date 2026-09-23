"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account/orders", label: "My Orders" },
  { href: "/account", label: "Profile & Address" },
  { href: "/track", label: "Track Order" },
];

export function AccountNav() {
  const pathname = usePathname();
  const cls = "block border-l-2 py-2 pl-3 text-sm transition";
  return (
    <nav className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
      {links.map((l) => {
        const active = l.href === "/account" ? pathname === "/account" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              cls,
              "shrink-0",
              active ? "border-accent font-medium" : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {l.label}
          </Link>
        );
      })}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className={cn(cls, "shrink-0 border-transparent text-left text-muted hover:text-foreground")}
      >
        Logout
      </button>
    </nav>
  );
}
