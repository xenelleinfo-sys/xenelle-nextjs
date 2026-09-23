"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ChevronRight, PackageSearch } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { getRecentOrders, orderHref, type RecentOrder } from "@/lib/recent-orders";
import { formatDate } from "@/lib/utils";

const TrackPage = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const { status } = useSession();
  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");
  const [recent, setRecent] = useState<RecentOrder[]>([]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- read device-saved orders after mount
  useEffect(() => setRecent(getRecentOrders().filter((o) => o.token)), []);

  const track = useMutation(
    trpc.order.track.mutationOptions({
      onSuccess: (r) => router.push(orderHref(r.orderNumber, r.token)),
      onError: (e) => toast.error(e.message),
    }),
  );

  return (
    <div className="container-x flex justify-center py-16 lg:py-24">
      <div className="w-full max-w-md">
        <div className="text-center">
          <PackageSearch className="mx-auto size-10 text-accent" strokeWidth={1.25} />
          <h1 className="heading-display mt-4 text-4xl lg:text-5xl">Track Your Order</h1>
          <p className="mt-3 text-sm text-muted">
            Enter your order number (e.g. XN-ABC12XYZ) and the phone number or email you used at checkout.
          </p>
        </div>

        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            track.mutate({ orderNumber: orderNumber.trim().toUpperCase(), contact: contact.trim() });
          }}
        >
          <Input
            label="Order number"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="XN-XXXXXXXX"
            className="[&_input]:uppercase"
            required
          />
          <Input
            label="Phone number or email"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="03001234567 or you@email.com"
            required
          />
          <Button type="submit" size="lg" className="w-full" loading={track.isPending}>
            Track Order
          </Button>
        </form>

        {recent.length > 0 && (
          <div className="mt-10">
            <p className="field-label">Orders placed on this device</p>
            <ul className="divide-y divide-line border border-line">
              {recent.map((o) => (
                <li key={o.orderNumber}>
                  <Link href={orderHref(o.orderNumber, o.token)} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-soft">
                    <span>
                      <span className="font-medium">{o.orderNumber}</span>
                      <span className="ml-2 text-xs text-muted">{formatDate(o.placedAt)}</span>
                    </span>
                    <ChevronRight className="size-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted">
          {status === "authenticated" ? (
            <Link href="/account/orders" className="underline underline-offset-4 hover:text-foreground">
              View all my orders
            </Link>
          ) : (
            <>
              Have an account?{" "}
              <Link href="/login?callbackUrl=/account/orders" className="underline underline-offset-4 hover:text-foreground">
                Login to see all your orders
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default TrackPage;
