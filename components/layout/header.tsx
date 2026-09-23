"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, LogOut, Menu, Package, Search, ShoppingBag, User, X } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useCart } from "@/components/cart/cart-context";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { Logo } from "./logo";
import { cn, formatPrice } from "@/lib/utils";

export function Header() {
  const trpc = useTRPC();
  const { data: categories } = useSuspenseQuery(trpc.catalog.categories.queryOptions());
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const nav = [
    { href: "/shop", label: "Shop All" },
    ...categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name })),
    { href: "/track", label: "Track Order" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur">
      <div className="bg-foreground py-2 text-center text-[11px] uppercase tracking-[0.2em] text-white">
        Free delivery above {formatPrice(FREE_SHIPPING_THRESHOLD)} · Cash on Delivery nationwide
      </div>

      <div className="container-x grid h-20 grid-cols-[1fr_auto_1fr] items-center border-b border-line lg:h-24">
        <div className="flex items-center gap-2">
          <button className="-ml-2 p-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <button className="hidden p-2 lg:block" onClick={() => setSearchOpen((s) => !s)} aria-label="Search">
            <Search className="size-5" />
          </button>
        </div>

        <Logo priority className="w-36 lg:w-48" />

        <div className="flex items-center justify-end gap-1">
          <button className="p-2 lg:hidden" onClick={() => setSearchOpen((s) => !s)} aria-label="Search">
            <Search className="size-5" />
          </button>
          <AccountMenu />
          <CartButton />
        </div>
      </div>

      <nav className="hidden border-b border-line lg:block">
        <ul className="container-x flex items-center justify-center gap-8">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "relative block py-3.5 text-xs font-medium uppercase tracking-[0.18em] transition hover:text-accent",
                  pathname === item.href && "text-accent",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {searchOpen && <SearchBar onClose={() => setSearchOpen(false)} />}
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} nav={nav} />
    </header>
  );
}

function SearchBar({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <div className="border-b border-line bg-white">
      <form
        className="container-x flex items-center gap-3 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!q.trim()) return;
          router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
          onClose();
        }}
      >
        <Search className="size-4 text-muted" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for 3 piece, lawn, chiffon…"
          className="flex-1 bg-transparent py-2 text-sm outline-none"
        />
        <button type="button" onClick={onClose} aria-label="Close search" className="p-1">
          <X className="size-4" />
        </button>
      </form>
    </div>
  );
}

function CartButton() {
  const { count, ready, setDrawerOpen } = useCart();
  return (
    <button className="relative p-2" onClick={() => setDrawerOpen(true)} aria-label="Open cart">
      <ShoppingBag className="size-5" />
      {ready && count > 0 && (
        <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] text-white">
          {count}
        </span>
      )}
    </button>
  );
}

function AccountMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (status !== "authenticated") {
    return (
      <Link href="/login" className="p-2" aria-label="Login">
        <User className="size-5" />
      </Link>
    );
  }

  const item = "flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-soft";
  return (
    <div className="relative" ref={ref}>
      <button className="p-2" onClick={() => setOpen((o) => !o)} aria-label="Account menu">
        <User className="size-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 border border-line bg-white py-1 shadow-lg">
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="truncate text-xs text-muted">{session.user.email}</p>
          </div>
          {session.user.role === "ADMIN" && (
            <Link href="/admin" className={item} onClick={() => setOpen(false)}>
              <LayoutDashboard className="size-4" /> Admin Panel
            </Link>
          )}
          <Link href="/account/orders" className={item} onClick={() => setOpen(false)}>
            <Package className="size-4" /> My Orders
          </Link>
          <Link href="/account" className={item} onClick={() => setOpen(false)}>
            <User className="size-4" /> My Account
          </Link>
          <button className={cn(item, "w-full text-left")} onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="size-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

function MobileMenu({
  open,
  onClose,
  nav,
}: {
  open: boolean;
  onClose: () => void;
  nav: { href: string; label: string }[];
}) {
  const { status } = useSession();
  return (
    <div className={cn("fixed inset-0 z-50 lg:hidden", !open && "pointer-events-none")}>
      <div
        className={cn("absolute inset-0 bg-black/40 transition-opacity", open ? "opacity-100" : "opacity-0")}
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-white transition-transform",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <Logo className="w-28" href={null} />
          <button onClick={onClose} aria-label="Close menu" className="p-1">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="block border-b border-line/60 px-5 py-3.5 text-sm uppercase tracking-[0.15em]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-line p-5">
          <Link
            href={status === "authenticated" ? "/account/orders" : "/login"}
            onClick={onClose}
            className="flex items-center gap-2 text-sm"
          >
            <User className="size-4" /> {status === "authenticated" ? "My Orders" : "Login / Register"}
          </Link>
        </div>
      </aside>
    </div>
  );
}
