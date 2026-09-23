"use client";

import { Input, Select } from "@/components/ui/field";
import { PROVINCES } from "@/lib/constants";
import type { AddressInput } from "@/lib/validators";

export type AddressErrors = Partial<Record<keyof AddressInput, string>>;

export function AddressFields({
  value,
  onChange,
  errors = {},
}: {
  value: AddressInput;
  onChange: (value: AddressInput) => void;
  errors?: AddressErrors;
}) {
  const set = (k: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...value, [k]: e.target.value });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Full name" value={value.fullName} onChange={set("fullName")} error={errors.fullName} autoComplete="name" />
      <Input
        label="Mobile number"
        value={value.phone}
        onChange={set("phone")}
        error={errors.phone}
        placeholder="03001234567"
        inputMode="tel"
        autoComplete="tel"
      />
      <Input
        label="Complete address"
        value={value.addressLine}
        onChange={set("addressLine")}
        error={errors.addressLine}
        placeholder="House #, street, area"
        className="sm:col-span-2"
        autoComplete="street-address"
      />
      <Input label="City" value={value.city} onChange={set("city")} error={errors.city} autoComplete="address-level2" />
      <Select label="Province" value={value.province ?? ""} onChange={set("province")}>
        <option value="">Select province</option>
        {PROVINCES.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </Select>
      <Input
        label="Postal code (optional)"
        value={value.postalCode ?? ""}
        onChange={set("postalCode")}
        inputMode="numeric"
        autoComplete="postal-code"
      />
    </div>
  );
}

export const emptyAddress: AddressInput = {
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  province: "",
  postalCode: "",
};
