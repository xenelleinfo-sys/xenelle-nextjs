"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Banknote, Check, ShoppingBag, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "@/trpc/client";
import { useCart } from "@/components/cart/cart-context";
import { AddressFields, emptyAddress, type AddressErrors } from "@/components/shop/address-fields";
import {
  emptyOnlinePayment,
  OnlinePaymentForm,
  onlinePaymentProofError,
} from "@/components/shop/online-payment";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, Input, Textarea } from "@/components/ui/field";
import { EmptyState, PageLoader } from "@/components/ui/misc";
import { ProductImage } from "@/components/ui/product-image";
import { DELIVERY_FEE, PAYMENT_METHODS, type PaymentMethodValue } from "@/lib/constants";
import { orderHref, saveRecentOrder } from "@/lib/recent-orders";
import { CouponBox } from "@/components/shop/coupon-box";
import { cn, couponDiscount, formatPrice } from "@/lib/utils";
import { addressSchema, type AddressInput, type OnlinePaymentProofInput } from "@/lib/validators";

const emailSchema = z.email();

const CheckoutPage = ({ loggedIn }: { loggedIn: boolean }) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const cart = useCart();
  // prefetched on the server when logged in; guests check out without an account
  const { data: me } = useQuery({ ...trpc.account.me.queryOptions(), enabled: loggedIn });
  const { data: accounts } = useSuspenseQuery(trpc.catalog.paymentAccounts.queryOptions());

  const [email, setEmail] = useState(me?.email ?? "");
  const [emailError, setEmailError] = useState<string>();
  const [address, setAddress] = useState<AddressInput>(
    me?.address ?? { ...emptyAddress, fullName: me?.name ?? "", phone: me?.phone ?? "" },
  );
  const [errors, setErrors] = useState<AddressErrors>({});
  const [notes, setNotes] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);
  const [method, setMethod] = useState<PaymentMethodValue>(accounts.length > 0 ? "ONLINE" : "COD");
  const [proof, setProof] = useState<OnlinePaymentProofInput>(emptyOnlinePayment);
  const [proofError, setProofError] = useState<string>();
  const [coupon, setCoupon] = useState<{ code: string; percent: number } | null>(null);

  const checkCoupon = useMutation(
    trpc.order.checkCoupon.mutationOptions({
      onSuccess: (c) => {
        setCoupon({ code: c.code, percent: c.percent });
        toast.success(`${c.code} applied — ${c.percent}% off`);
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const placeOrder = useMutation(
    trpc.order.place.mutationOptions({
      onSuccess: async (order) => {
        saveRecentOrder({ orderNumber: order.orderNumber, token: order.accessToken ?? "" });
        cart.clear();
        if (loggedIn) await queryClient.invalidateQueries({ queryKey: trpc.order.mine.queryKey() });
        const href = orderHref(order.orderNumber, order.accessToken);
        router.push(`${href}${href.includes("?") ? "&" : "?"}placed=1`);
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  if (!cart.ready) return <PageLoader />;
  if (cart.items.length === 0 && !placeOrder.isSuccess) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-12" strokeWidth={1} />}
        title="Your bag is empty"
        action={<ButtonLink href="/shop">Continue Shopping</ButtonLink>}
      />
    );
  }

  const deliveryFee = DELIVERY_FEE[method];
  const discount = coupon ? couponDiscount(cart.subtotal, coupon.percent) : 0;
  const total = cart.subtotal - discount + deliveryFee;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailOk = emailSchema.safeParse(email.trim());
    setEmailError(emailOk.success ? undefined : "Enter a valid email");

    const parsed = addressSchema.safeParse(address);
    const next: AddressErrors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof AddressInput] ??= issue.message;
    }
    setErrors(next);
    if (!emailOk.success || !parsed.success) {
      return toast.error("Please complete your contact and delivery details");
    }

    if (method === "ONLINE") {
      const err = onlinePaymentProofError(proof);
      setProofError(err ?? undefined);
      if (err) return toast.error(err);
    }

    placeOrder.mutate({
      email: email.trim(),
      shipping: parsed.data,
      paymentMethod: method,
      onlinePayment: method === "ONLINE" ? proof : null,
      couponCode: coupon?.code ?? null,
      notes: notes.trim() || null,
      saveAddress,
      items: cart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        sizeType: i.sizeType,
        size: i.size,
        measurements: i.measurements,
        notes: i.notes,
      })),
    });
  };

  return (
    <div className="container-x py-10 lg:py-14">
      <h1 className="heading-display mb-10 text-center text-4xl lg:text-5xl">Checkout</h1>
      <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_420px]" noValidate>
        <div className="min-w-0 space-y-10">
          <section>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xs font-medium uppercase tracking-[0.2em]">Contact</h2>
              {!loggedIn && (
                <p className="text-xs text-muted">
                  Have an account?{" "}
                  <Link href="/login?callbackUrl=/checkout" className="text-foreground underline underline-offset-2">
                    Login
                  </Link>{" "}
                  (optional)
                </p>
              )}
            </div>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              autoComplete="email"
              hint="Order updates and your order link are tied to this email."
            />
          </section>

          <section>
            <h2 className="mb-5 text-xs font-medium uppercase tracking-[0.2em]">Delivery Details</h2>
            <AddressFields value={address} onChange={setAddress} errors={errors} />
            {loggedIn && (
              <Checkbox
                label="Save this address for next time"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
                className="mt-4"
              />
            )}
          </section>

          <section>
            <h2 className="mb-5 text-xs font-medium uppercase tracking-[0.2em]">Payment</h2>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
              {(["ONLINE", "COD"] as const).map((m) => {
                const disabled = m === "ONLINE" && accounts.length === 0;
                const selected = method === m;
                const Icon = m === "ONLINE" ? Smartphone : Banknote;
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`${PAYMENT_METHODS[m].label} — ${m === "ONLINE" ? "free delivery" : `${formatPrice(DELIVERY_FEE.COD)} delivery`}`}
                    disabled={disabled}
                    onClick={() => setMethod(m)}
                    className={cn(
                      "relative border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
                      selected ? "border-foreground ring-1 ring-foreground" : "border-line hover:border-foreground/40",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Icon className="size-4 text-accent" /> {PAYMENT_METHODS[m].label}
                      </span>
                      {selected && <Check className="size-4" />}
                    </div>
                    <p className="mt-1.5 text-xs text-muted">{PAYMENT_METHODS[m].description}</p>
                    <span
                      className={cn(
                        "mt-3 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
                        m === "ONLINE" ? "bg-emerald-50 text-emerald-700" : "bg-soft text-muted",
                      )}
                    >
                      {m === "ONLINE" ? "Free delivery" : `+ ${formatPrice(DELIVERY_FEE.COD)} delivery`}
                    </span>
                  </button>
                );
              })}
            </div>

            {method === "ONLINE" && (
              <div className="mt-6 border border-line p-4 sm:p-5">
                <OnlinePaymentForm
                  accounts={accounts}
                  amount={total}
                  value={proof}
                  onChange={(v) => {
                    setProof(v);
                    if (proofError) setProofError(onlinePaymentProofError(v) ?? undefined);
                  }}
                  error={proofError}
                />
              </div>
            )}
          </section>

          <Textarea
            label="Order notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            placeholder="Anything we should know about delivery?"
          />
        </div>

        <aside className="h-fit bg-soft p-6 lg:sticky lg:top-44">
          <h2 className="text-xs font-medium uppercase tracking-[0.2em]">Your Order</h2>
          <ul className="mt-5 max-h-80 space-y-4 overflow-y-auto">
            {cart.items.map((i) => (
              <li key={i.key} className="flex gap-3">
                <div className="relative aspect-[3/4] w-14 shrink-0 bg-white">
                  <ProductImage src={i.image} alt={i.name} fill sizes="56px" />
                  <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] text-white">
                    {i.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="line-clamp-1">{i.name}</p>
                  <p className="text-xs text-muted">{i.sizeType === "STANDARD" ? `Size ${i.size}` : "Custom measurements"}</p>
                </div>
                <span className="text-sm">{formatPrice(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <CouponBox
            applied={coupon}
            loading={checkCoupon.isPending}
            onApply={(code) => checkCoupon.mutate({ code, subtotal: cart.subtotal })}
            onRemove={() => setCoupon(null)}
          />
          <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(cart.subtotal)}</dd></div>
            {coupon && (
              <div className="flex justify-between text-emerald-700">
                <dt>
                  Coupon {coupon.code} ({coupon.percent}%)
                </dt>
                <dd>− {formatPrice(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd className={deliveryFee === 0 ? "text-emerald-700" : undefined}>
                {deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
              <dt>Total</dt><dd>{formatPrice(total)}</dd>
            </div>
            <p className="text-xs text-muted">
              {method === "ONLINE" ? "Paid online via JazzCash / EasyPaisa" : "Pay in cash when your order arrives"}
            </p>
          </dl>
          <Button type="submit" size="lg" className="mt-6 w-full" loading={placeOrder.isPending}>
            Place Order
          </Button>
          <p className="mt-3 text-center text-xs text-muted">
            {method === "ONLINE"
              ? "We verify your payment, then confirm your order."
              : "We'll call you to confirm your order and measurements."}
          </p>
        </aside>
      </form>
    </div>
  );
};

export default CheckoutPage;
