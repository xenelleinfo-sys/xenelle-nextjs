"use client";
import Link from "next/link";
import { useSuspenseQueries } from "@tanstack/react-query";
import { ArrowRight, Banknote, Ruler, Shirt } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { ButtonLink } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { ProductGrid } from "@/components/shop/product-card";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=2000&q=80&auto=format&fit=crop";

const steps = [
  { icon: Shirt, title: "Choose a Design", text: "Browse our 2 piece and 3 piece stitching designs." },
  { icon: Ruler, title: "Share Your Size", text: "Pick a standard size or enter your own measurements." },
  { icon: Banknote, title: "Pay Your Way", text: "Pay online via JazzCash / EasyPaisa for free delivery, or cash on delivery." },
];

const HomePage = () => {
  const trpc = useTRPC();
  // multiple prefetched queries in one go
  const [{ data: home }, { data: categories }] = useSuspenseQueries({
    queries: [trpc.catalog.home.queryOptions(), trpc.catalog.categories.queryOptions()],
  });

  return (
    <>
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[460px] overflow-hidden bg-soft lg:h-[82vh]">
        <ProductImage src={HERO_IMAGE} alt="Custom stitched dresses" fill priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="container-x relative flex h-full flex-col items-center justify-end pb-16 text-center text-white lg:pb-24">
          <p className="text-[11px] uppercase tracking-[0.35em]">New Season · Made to Measure</p>
          <h1 className="heading-display mt-4 max-w-3xl text-5xl leading-tight lg:text-7xl">
            Stitched Just For You
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/85">
            Designer 2 piece & 3 piece suits tailored to your size. Cash on delivery across Pakistan.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/shop" size="lg" className="">
              Shop Now
            </ButtonLink>
            <ButtonLink href="/track" size="lg" variant="outline" className="border-white text-white">
              Track Order
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container-x mt-20">
          <SectionTitle eyebrow="Shop by" title="Category" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {categories.map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-soft">
                <ProductImage
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="heading-display text-2xl lg:text-3xl">{c.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.2em]">
                    {c.productCount} designs <ArrowRight className="size-3 transition group-hover:translate-x-1" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {home.featured.length > 0 && (
        <section className="container-x mt-24">
          <SectionTitle eyebrow="Handpicked" title="Featured Designs" href="/shop" />
          <ProductGrid products={home.featured} />
        </section>
      )}

      {/* How it works */}
      <section className="mt-24 bg-soft py-20">
        <div className="container-x">
          <SectionTitle eyebrow="Simple as" title="How It Works" />
          <div className="grid gap-10 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-accent/40 text-accent">
                  <Icon className="size-6" strokeWidth={1.5} />
                </div>
                <p className="eyebrow mt-5">Step {i + 1}</p>
                <h3 className="heading-display mt-2 text-2xl">{title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      {home.newArrivals.length > 0 && (
        <section className="container-x mt-24">
          <SectionTitle eyebrow="Just in" title="New Arrivals" href="/shop" />
          <ProductGrid products={home.newArrivals} />
        </section>
      )}
    </>
  );
};

function SectionTitle({ eyebrow, title, href }: { eyebrow: string; title: string; href?: string }) {
  return (
    <div className="mb-10 flex flex-col items-center text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="heading-display mt-2 text-4xl lg:text-5xl">{title}</h2>
      {href && (
        <Link href={href} className="mt-3 text-xs uppercase tracking-[0.2em] underline underline-offset-4 hover:text-accent">
          View all
        </Link>
      )}
    </div>
  );
}

export default HomePage;
