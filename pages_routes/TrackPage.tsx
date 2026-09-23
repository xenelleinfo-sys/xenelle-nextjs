"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

const TrackPage = () => {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");

  return (
    <div className="container-x flex justify-center py-16 lg:py-24">
      <div className="w-full max-w-md text-center">
        <PackageSearch className="mx-auto size-10 text-accent" strokeWidth={1.25} />
        <h1 className="heading-display mt-4 text-4xl lg:text-5xl">Track Your Order</h1>
        <p className="mt-3 text-sm text-muted">
          Enter the order number from your confirmation (e.g. XN-ABC12XYZ). You will be asked to login if you
          aren&apos;t already.
        </p>
        <form
          className="mt-8 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = orderNumber.trim().toUpperCase();
            if (n) router.push(`/account/orders/${encodeURIComponent(n)}`);
          }}
        >
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Order number"
            className="field flex-1 uppercase"
            required
          />
          <Button type="submit">Track</Button>
        </form>
        <button
          onClick={() => router.push("/account/orders")}
          className="mt-6 text-xs uppercase tracking-wider text-muted underline underline-offset-4 hover:text-foreground"
        >
          View all my orders
        </button>
      </div>
    </div>
  );
};

export default TrackPage;
