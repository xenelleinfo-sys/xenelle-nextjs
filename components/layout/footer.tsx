import Link from "next/link";
import { Banknote, Ruler, Scissors, Truck } from "lucide-react";
import { CONTACT, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { Logo } from "./logo";

const perks = [
  { icon: Scissors, title: "Expert Tailoring", text: "Stitched by experienced tailors" },
  { icon: Ruler, title: "Your Measurements", text: "Standard sizes or custom fit" },
  { icon: Banknote, title: "Rs. 1,000 Advance", text: "Rest cash on delivery" },
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
