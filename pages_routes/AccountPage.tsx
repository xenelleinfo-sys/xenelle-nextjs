"use client";
import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { AddressFields, emptyAddress } from "@/components/shop/address-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { addressSchema, type AddressInput } from "@/lib/validators";

const AccountPage = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { update } = useSession();
  const { data: me } = useSuspenseQuery(trpc.account.me.queryOptions());

  const [name, setName] = useState(me.name);
  const [phone, setPhone] = useState(me.phone ?? "");
  const [address, setAddress] = useState<AddressInput>(me.address ?? emptyAddress);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });

  const updateProfile = useMutation(
    trpc.account.updateProfile.mutationOptions({
      onSuccess: async (u) => {
        toast.success("Profile updated");
        await update({ user: { name: u.name, phone: u.phone } });
        queryClient.invalidateQueries({ queryKey: trpc.account.me.queryKey() });
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const changePassword = useMutation(
    trpc.account.changePassword.mutationOptions({
      onSuccess: () => {
        toast.success("Password changed");
        setPw({ currentPassword: "", newPassword: "" });
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const hasAddress = Object.values(address).some((v) => v && String(v).trim());
    let parsedAddress: AddressInput | null = null;
    if (hasAddress) {
      const parsed = addressSchema.safeParse(address);
      if (!parsed.success) return toast.error(parsed.error.issues[0].message);
      parsedAddress = parsed.data;
    }
    updateProfile.mutate({ name, phone, address: parsedAddress });
  };

  return (
    <div className="space-y-10">
      <form onSubmit={saveProfile} className="card space-y-6 p-6">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em]">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Email" value={me.email} disabled className="sm:col-span-2" />
        </div>
        <h2 className="pt-2 text-xs font-medium uppercase tracking-[0.2em]">Default Delivery Address</h2>
        <AddressFields value={address} onChange={setAddress} />
        <Button type="submit" loading={updateProfile.isPending}>Save Changes</Button>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          changePassword.mutate(pw);
        }}
        className="card space-y-5 p-6"
      >
        <h2 className="text-xs font-medium uppercase tracking-[0.2em]">Change Password</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Current password"
            type="password"
            value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
            autoComplete="current-password"
          />
          <Input
            label="New password"
            type="password"
            value={pw.newPassword}
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" variant="outline" loading={changePassword.isPending}>Update Password</Button>
      </form>
    </div>
  );
};

export default AccountPage;
