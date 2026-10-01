import Link from "next/link";
import { Banknote, Ruler, Scissors, Truck } from "lucide-react";
import { CONTACT, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { Logo } from "./logo";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

const perks = [
  { icon: Scissors, title: "Expert Tailoring", text: "Stitched by experienced tailors" },
  { icon: Ruler, title: "Your Measurements", text: "Standard sizes or custom fit" },
  { icon: Banknote, title: "Online or COD", text: "Free delivery on online payment" },
  { icon: Truck, title: "Nationwide Delivery", text: "Delivered to your doorstep" },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="border-b border-line bg-soft">
        <div className="container-x grid grid-cols-2 gap-6 py-10 lg:grid-cols-4">
          {perks.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.5} />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider">{title}</p>
                <p className="mt-1 text-xs text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo className="w-40" />
          <p className="eyebrow mt-3">{SITE_TAGLINE}</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Choose a design, share your size or measurements and we stitch it for you — delivered with
            cash on delivery.
          </p>
        </div>
        <FooterCol
          title="Shop"
          links={[
            ["Shop All", "/shop"],
            ["2 Piece", "/category/2-piece"],
            ["3 Piece", "/category/3-piece"],
          ]}
        />
        <FooterCol
          title="Account"
          links={[
            ["My Orders", "/account/orders"],
            ["Track Order", "/track"],
            ["My Bag", "/cart"],
          ]}
        />
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em]">Customer Care</p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>{CONTACT.hours}</li>
            <li>WhatsApp: {CONTACT.whatsapp}</li>
            <li>{CONTACT.email}</li>
            <li>
              <Link href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground">
                <InstagramIcon className="size-4" />
                Instagram
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">
        © {SITE_NAME}. All rights reserved.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.2em]">{title}</p>
      <ul className="mt-4 space-y-2 text-sm text-muted">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="hover:text-foreground">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
