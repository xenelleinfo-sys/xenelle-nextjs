"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Banknote, ShieldCheck, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useCart } from "@/components/cart/cart-context";
import { AddressFields, emptyAddress, type AddressErrors } from "@/components/shop/address-fields";
import { AdvancePaymentForm, advanceProofError, emptyAdvance } from "@/components/shop/advance-payment";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, Textarea } from "@/components/ui/field";
import { EmptyState, PageLoader } from "@/components/ui/misc";
import { ProductImage } from "@/components/ui/product-image";
import { ADVANCE_AMOUNT } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { addressSchema, type AddressInput, type AdvanceProofInput } from "@/lib/validators";

const CheckoutPage = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const cart = useCart();
  const { data: me } = useSuspenseQuery(trpc.account.me.queryOptions());
  const { data: accounts } = useSuspenseQuery(trpc.catalog.paymentAccounts.queryOptions());

  const [address, setAddress] = useState<AddressInput>(
    me.address ?? { ...emptyAddress, fullName: me.name, phone: me.phone ?? "" },
  );
  const [errors, setErrors] = useState<AddressErrors>({});
  const [notes, setNotes] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);
  const [advance, setAdvance] = useState<AdvanceProofInput>(emptyAdvance);
  const [advanceError, setAdvanceError] = useState<string>();

  const placeOrder = useMutation(
    trpc.order.place.mutationOptions({
      onSuccess: async (order) => {
        cart.clear();
        await queryClient.invalidateQueries({ queryKey: trpc.order.mine.queryKey() });
        router.push(`/account/orders/${order.orderNumber}?placed=1`);
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

  const advanceAmount = Math.min(ADVANCE_AMOUNT, cart.total);
  const balance = cart.total - advanceAmount;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = addressSchema.safeParse(address);
    if (!parsed.success) {
      const next: AddressErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof AddressInput;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return toast.error("Please complete your delivery details");
    }
    setErrors({});
    const proofError = advanceProofError(advance);
    setAdvanceError(proofError ?? undefined);
    if (proofError) return toast.error(proofError);
    placeOrder.mutate({
      shipping: parsed.data,
      advance,
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
      <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_420px]">
        <div className="space-y-10">
          <section>
            <h2 className="mb-5 text-xs font-medium uppercase tracking-[0.2em]">Delivery Details</h2>
            <AddressFields value={address} onChange={setAddress} errors={errors} />
            <Checkbox
              label="Save this address for next time"
              checked={saveAddress}
              onChange={(e) => setSaveAddress(e.target.checked)}
              className="mt-4"
            />
          </section>

          <section>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.2em]">Advance Payment</h2>
            <p className="mb-5 flex items-start gap-2 text-sm text-muted">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
              To start stitching we take {formatPrice(advanceAmount)} advance via JazzCash / EasyPaisa. Your order is
              confirmed as soon as we verify the payment.
            </p>
            <AdvancePaymentForm
              accounts={accounts}
              amount={advanceAmount}
              value={advance}
              onChange={(v) => {
                setAdvance(v);
                if (advanceError) setAdvanceError(advanceProofError(v) ?? undefined);
              }}
              error={advanceError}
            />
          </section>

          <section>
            <h2 className="mb-5 text-xs font-medium uppercase tracking-[0.2em]">Balance Payment</h2>
            <div className="flex items-center gap-4 border border-line p-4">
              <Banknote className="size-6 text-accent" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium">Cash on Delivery — {formatPrice(balance)}</p>
                <p className="text-xs text-muted">Pay the remaining amount in cash when your order is delivered.</p>
              </div>
            </div>
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
          <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(cart.subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt>Shipping</dt><dd>{cart.shippingFee === 0 ? "Free" : formatPrice(cart.shippingFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
              <dt>Total</dt><dd>{formatPrice(cart.total)}</dd>
            </div>
            <div className="flex justify-between text-accent-dark">
              <dt>Advance (JazzCash / EasyPaisa)</dt><dd>− {formatPrice(advanceAmount)}</dd>
            </div>
            <div className="flex justify-between font-medium">
              <dt>Cash on delivery</dt><dd>{formatPrice(balance)}</dd>
            </div>
          </dl>
          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            loading={placeOrder.isPending}
            disabled={accounts.length === 0}
          >
            Place Order
          </Button>
          <p className="mt-3 text-center text-xs text-muted">
            We verify your advance and call you to confirm your measurements.
          </p>
        </aside>
      </form>
    </div>
  );
};

export default CheckoutPage;
