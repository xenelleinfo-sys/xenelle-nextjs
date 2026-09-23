"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@/trpc/types";
import { ImageUploader } from "@/components/admin/image-uploader";
import { PageHeader, Panel, Toggle } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { productInputSchema, type ProductInput } from "@/lib/validators";

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const emptyProduct: ProductInput = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  price: 0,
  salePrice: null,
  images: [],
  fabric: "",
  includes: "",
  deliveryDays: 10,
  sizes: ["XS", "S", "M", "L", "XL"],
  isActive: true,
  isFeatured: false,
  categoryId: "",
};

type Errors = Partial<Record<keyof ProductInput, string>>;
type ExistingProduct = RouterOutputs["admin"]["products"]["byId"];

const ProductFormPage = ({ id }: { id?: string }) =>
  id ? <EditProduct id={id} /> : <ProductForm existing={null} />;

// edit mode: product is prefetched on the server
function EditProduct({ id }: { id: string }) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.admin.products.byId.queryOptions({ id }));
  return <ProductForm existing={data} />;
}

function ProductForm({ existing }: { existing: ExistingProduct | null }) {
  const id = existing?.id;
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: categories } = useSuspenseQuery(trpc.admin.categories.list.queryOptions());

  const [form, setForm] = useState<ProductInput>(() =>
    existing
      ? {
          name: existing.name,
          slug: existing.slug,
          sku: existing.sku ?? "",
          description: existing.description,
          price: existing.price,
          salePrice: existing.salePrice ?? null,
          images: existing.images,
          fabric: existing.fabric ?? "",
          includes: existing.includes ?? "",
          deliveryDays: existing.deliveryDays,
          sizes: existing.sizes,
          isActive: existing.isActive,
          isFeatured: existing.isFeatured,
          categoryId: existing.categoryId,
        }
      : { ...emptyProduct, categoryId: categories[0]?.id ?? "" },
  );
  const [errors, setErrors] = useState<Errors>({});

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onDone = async (msg: string) => {
    toast.success(msg);
    await queryClient.invalidateQueries({ queryKey: trpc.admin.products.pathKey() });
    await queryClient.invalidateQueries({ queryKey: trpc.admin.categories.list.queryKey() });
    router.push("/admin/products");
  };

  const create = useMutation(
    trpc.admin.products.create.mutationOptions({
      onSuccess: () => onDone("Product created"),
      onError: (e) => toast.error(e.message),
    }),
  );
  const update = useMutation(
    trpc.admin.products.update.mutationOptions({
      onSuccess: () => onDone("Product updated"),
      onError: (e) => toast.error(e.message),
    }),
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = productInputSchema.safeParse({
      ...form,
      sku: form.sku || null,
      fabric: form.fabric || null,
      includes: form.includes || null,
      salePrice: form.salePrice || null,
    });
    if (!parsed.success) {
      const next: Errors = {};
      for (const i of parsed.error.issues) next[i.path[0] as keyof ProductInput] ??= i.message;
      setErrors(next);
      return toast.error("Please fix the highlighted fields");
    }
    setErrors({});
    if (id) update.mutate({ id, data: parsed.data });
    else create.mutate(parsed.data);
  };

  if (categories.length === 0) {
    return (
      <Panel className="p-10 text-center">
        <p className="text-sm text-muted">Create a category first (e.g. 2 Piece, 3 Piece).</p>
        <Link href="/admin/categories" className="mt-3 inline-block text-sm text-accent underline">Go to categories</Link>
      </Panel>
    );
  }

  return (
    <form onSubmit={submit}>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" /> Products
      </Link>
      <PageHeader
        title={id ? "Edit Product" : "New Product"}
        actions={
          <>
            {existing && (
              <Link href={`/product/${existing.slug}`} target="_blank" className="inline-flex items-center gap-1 self-center text-sm text-muted hover:text-foreground">
                View in store <ExternalLink className="size-3.5" />
              </Link>
            )}
            <Button type="submit" size="sm" loading={create.isPending || update.isPending}>
              {id ? "Save Changes" : "Create Product"}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Panel className="space-y-4 p-5">
            <Input label="Name" value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} placeholder="e.g. Embroidered Lawn 3 Piece" />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              error={errors.description}
              rows={6}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Fabric" value={form.fabric ?? ""} onChange={(e) => set("fabric", e.target.value)} placeholder="Lawn, Chiffon, Khaddar…" />
              <Input label="Includes" value={form.includes ?? ""} onChange={(e) => set("includes", e.target.value)} placeholder="Shirt, Dupatta, Trouser" />
            </div>
          </Panel>

          <Panel className="p-5">
            <p className="field-label">Images</p>
            <ImageUploader value={form.images} onChange={(v) => set("images", v)} />
            {errors.images && <p className="mt-2 text-xs text-danger">{errors.images}</p>}
          </Panel>

          <Panel className="p-5">
            <p className="field-label">Available standard sizes</p>
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map((s) => {
                const on = form.sizes.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() =>
                      set("sizes", on ? form.sizes.filter((x) => x !== s) : ALL_SIZES.filter((x) => x === s || form.sizes.includes(x)))
                    }
                    className={cn("h-9 min-w-11 rounded border px-3 text-sm", on ? "border-foreground bg-foreground text-white" : "border-line")}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {errors.sizes && <p className="mt-2 text-xs text-danger">Select at least one size</p>}
            <p className="mt-2 text-xs text-muted">Customers can always choose custom measurements too.</p>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel className="space-y-4 p-5">
            <div className="flex items-center justify-between text-sm">
              <span>Active (visible in store)</span>
              <Toggle checked={form.isActive} onChange={(v) => set("isActive", v)} label="Active" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Featured on home page</span>
              <Toggle checked={form.isFeatured} onChange={(v) => set("isFeatured", v)} label="Featured" />
            </div>
          </Panel>

          <Panel className="space-y-4 p-5">
            <Select label="Category" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} error={errors.categoryId}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Input
              label="Price (Rs.)"
              type="number"
              min={0}
              value={form.price || ""}
              onChange={(e) => set("price", Number(e.target.value))}
              error={errors.price}
            />
            <Input
              label="Sale price (optional)"
              type="number"
              min={0}
              value={form.salePrice ?? ""}
              onChange={(e) => set("salePrice", e.target.value ? Number(e.target.value) : null)}
              error={errors.salePrice}
            />
            <Input
              label="Stitching time (days)"
              type="number"
              min={1}
              value={form.deliveryDays}
              onChange={(e) => set("deliveryDays", Number(e.target.value))}
              error={errors.deliveryDays}
            />
            <Input label="SKU (optional)" value={form.sku ?? ""} onChange={(e) => set("sku", e.target.value)} />
            <Input
              label="URL slug"
              value={form.slug ?? ""}
              onChange={(e) => set("slug", e.target.value)}
              hint="Leave empty to generate from the name"
            />
          </Panel>
        </div>
      </div>
    </form>
  );
}

export default ProductFormPage;
