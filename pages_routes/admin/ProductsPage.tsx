"use client";
import Link from "next/link";
import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { PageHeader, Pager, Panel, Table, Toggle, useDebounced } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Price, Spinner } from "@/components/ui/misc";
import { ProductImage } from "@/components/ui/product-image";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ProductsPage = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<"" | "active" | "inactive">("");
  const [stockFilter, setStockFilter] = useState<"" | "low" | "out">("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);

  const { data: categories } = useSuspenseQuery(trpc.admin.categories.list.queryOptions());
  const { data, isFetching } = useQuery({
    ...trpc.admin.products.list.queryOptions({
      page,
      limit: 20,
      q: q || undefined,
      categoryId: categoryId || undefined,
      status: status || undefined,
      stock: stockFilter || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: trpc.admin.products.list.queryKey() });

  const toggle = useMutation(
    trpc.admin.products.toggle.mutationOptions({ onSuccess: invalidate, onError: (e) => toast.error(e.message) }),
  );
  const remove = useMutation(
    trpc.admin.products.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Product deleted");
        invalidate();
        queryClient.invalidateQueries({ queryKey: trpc.admin.categories.list.queryKey() });
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  return (
    <>
      <PageHeader
        title="Products"
        description="Stitching designs shown in the store"
        actions={
          <ButtonLink href="/admin/products/new" size="sm">
            <Plus className="size-3.5" /> Add Product
          </ButtonLink>
        }
      />
      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <div className="flex min-w-48 flex-1 items-center gap-2">
            <Search className="size-4 text-muted" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name or SKU"
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            className="rounded border border-line px-2 py-1.5 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setPage(1);
            }}
            className="rounded border border-line px-2 py-1.5 text-sm"
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Hidden</option>
          </select>
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value as typeof stockFilter);
              setPage(1);
            }}
            className="rounded border border-line px-2 py-1.5 text-sm"
          >
            <option value="">All stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
          {isFetching && <Spinner className="size-4" />}
        </div>

        {!data ? (
          <div className="flex justify-center p-10"><Spinner /></div>
        ) : data.items.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">No products found.</p>
        ) : (
          <Table>
            <thead>
              <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Active</th><th>Featured</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="hover:bg-soft/60">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded bg-soft">
                        <ProductImage src={p.images[0]} alt={p.name} fill sizes="44px" />
                      </div>
                      <div className="min-w-0">
                        <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                        {p.sku && <p className="text-xs text-muted">{p.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="text-muted">{p.category.name}</td>
                  <td><Price price={p.price} salePrice={p.salePrice} /></td>
                  <td><StockCell id={p.id} stock={p.stock} onSaved={invalidate} /></td>
                  <td>
                    <Toggle
                      label="Active"
                      checked={p.isActive}
                      disabled={toggle.isPending}
                      onChange={(value) => toggle.mutate({ id: p.id, field: "isActive", value })}
                    />
                  </td>
                  <td>
                    <Toggle
                      label="Featured"
                      checked={p.isFeatured}
                      disabled={toggle.isPending}
                      onChange={(value) => toggle.mutate({ id: p.id, field: "isFeatured", value })}
                    />
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/products/${p.id}`} className="rounded p-2 text-muted hover:bg-soft hover:text-foreground" aria-label="Edit">
                        <Pencil className="size-4" />
                      </Link>
                      <button
                        className="rounded p-2 text-muted hover:bg-rose-50 hover:text-danger"
                        aria-label="Delete"
                        onClick={() => {
                          if (confirm(`Delete "${p.name}"? Existing orders keep their copy.`)) remove.mutate({ id: p.id });
                        }}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {data && <Pager page={page} totalPages={data.totalPages} onChange={setPage} />}
      </Panel>
    </>
  );
};

/** Inline stock editor: click the number, type, Enter to save. Empty = not tracked. */
function StockCell({ id, stock, onSaved }: { id: string; stock: number | null; onSaved: () => void }) {
  const trpc = useTRPC();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(stock == null ? "" : String(stock));
  const save = useMutation(
    trpc.admin.products.setStock.mutationOptions({
      onSuccess: () => {
        setEditing(false);
        onSaved();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  if (editing) {
    return (
      <form
        className="flex items-center gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          const n = value.trim() === "" ? null : Math.max(0, Math.floor(Number(value)));
          if (n != null && Number.isNaN(n)) return toast.error("Enter a number");
          save.mutate({ id, stock: n });
        }}
      >
        <input
          autoFocus
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
          placeholder="∞"
          className="w-16 rounded border border-line px-2 py-1 text-sm"
          aria-label="Units in stock (empty = not tracked)"
        />
        <button type="submit" className="rounded bg-foreground px-2 py-1 text-xs text-white" disabled={save.isPending}>
          Save
        </button>
      </form>
    );
  }

  const tone =
    stock == null
      ? "text-muted"
      : stock <= 0
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : stock <= LOW_STOCK_THRESHOLD
          ? "bg-amber-50 text-amber-800 ring-amber-200"
          : "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return (
    <button
      onClick={() => {
        setValue(stock == null ? "" : String(stock));
        setEditing(true);
      }}
      title="Click to edit stock"
      className={cn("rounded-full px-2.5 py-0.5 text-xs", stock != null && "ring-1 ring-inset", tone)}
    >
      {stock == null ? "Not tracked" : stock <= 0 ? "Out of stock" : `${stock} in stock`}
    </button>
  );
}

export default ProductsPage;
