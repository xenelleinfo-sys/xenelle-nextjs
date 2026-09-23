"use client";
import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@/trpc/types";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Modal, PageHeader, Panel, Table, Toggle } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { ProductImage } from "@/components/ui/product-image";
import type { CategoryInput } from "@/lib/validators";

type Category = RouterOutputs["admin"]["categories"]["list"][number];

const empty: CategoryInput = { name: "", slug: "", description: "", image: "", sortOrder: 0, isActive: true };

const CategoriesPage = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: categories } = useSuspenseQuery(trpc.admin.categories.list.queryOptions());
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: trpc.admin.categories.list.queryKey() });

  const remove = useMutation(
    trpc.admin.categories.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Category deleted");
        invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );
  const toggle = useMutation(
    trpc.admin.categories.update.mutationOptions({ onSuccess: invalidate, onError: (e) => toast.error(e.message) }),
  );

  return (
    <>
      <PageHeader
        title="Categories"
        description="Shown in the store sidebar & menu (e.g. 2 Piece, 3 Piece)"
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="size-3.5" /> Add Category
          </Button>
        }
      />
      <Panel>
        {categories.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">No categories yet.</p>
        ) : (
          <Table>
            <thead>
              <tr><th>Category</th><th>Slug</th><th>Order</th><th>Products</th><th>Active</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded bg-soft">
                        <ProductImage src={c.image} alt={c.name} fill sizes="40px" />
                      </div>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="text-muted">/{c.slug}</td>
                  <td>{c.sortOrder}</td>
                  <td>{c.productCount}</td>
                  <td>
                    <Toggle
                      label="Active"
                      checked={c.isActive}
                      disabled={toggle.isPending}
                      onChange={(isActive) => toggle.mutate({ id: c.id, data: toInput({ ...c, isActive }) })}
                    />
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button className="rounded p-2 text-muted hover:bg-soft hover:text-foreground" onClick={() => setEditing(c)} aria-label="Edit">
                        <Pencil className="size-4" />
                      </button>
                      <button
                        className="rounded p-2 text-muted hover:bg-rose-50 hover:text-danger"
                        aria-label="Delete"
                        onClick={() => confirm(`Delete "${c.name}"?`) && remove.mutate({ id: c.id })}
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
      </Panel>

      {editing && (
        <CategoryForm
          category={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            invalidate();
          }}
        />
      )}
    </>
  );
};

function toInput(c: Category): CategoryInput {
  return {
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    image: c.image ?? "",
    sortOrder: c.sortOrder,
    isActive: c.isActive,
  };
}

function CategoryForm({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const trpc = useTRPC();
  const [form, setForm] = useState<CategoryInput>(category ? toInput(category) : empty);
  const opts = {
    onSuccess: () => {
      toast.success(category ? "Category updated" : "Category created");
      onSaved();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  };
  const create = useMutation(trpc.admin.categories.create.mutationOptions(opts));
  const update = useMutation(trpc.admin.categories.update.mutationOptions(opts));

  return (
    <Modal open onClose={onClose} title={category ? "Edit Category" : "New Category"}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const data = { ...form, description: form.description || null, image: form.image || null };
          if (category) update.mutate({ id: category.id, data });
          else create.mutate(data);
        }}
      >
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="3 Piece" required />
        <Input label="Slug" value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} hint="Leave empty to generate from the name" />
        <Textarea label="Description" rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input
          label="Sort order"
          type="number"
          min={0}
          value={form.sortOrder}
          onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
        />
        <div>
          <p className="field-label">Cover image</p>
          <ImageUploader value={form.image ? [form.image] : []} onChange={(v) => setForm({ ...form, image: v[0] ?? "" })} max={1} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={create.isPending || update.isPending}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

export default CategoriesPage;
