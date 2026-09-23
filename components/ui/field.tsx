import { cn } from "@/lib/utils";

type Base = { label?: string; error?: string; hint?: string; className?: string };

export function Field({
  label,
  error,
  hint,
  className,
  children,
}: Base & { children: React.ReactNode }) {
  return (
    <label className={cn("block", className)}>
      {label && <span className="field-label">{label}</span>}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({
  label,
  error,
  hint,
  className,
  ...rest
}: Base & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      <input className={cn("field", error && "border-danger")} {...rest} />
    </Field>
  );
}

export function Textarea({
  label,
  error,
  hint,
  className,
  ...rest
}: Base & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      <textarea className={cn("field min-h-24", error && "border-danger")} {...rest} />
    </Field>
  );
}

export function Select({
  label,
  error,
  hint,
  className,
  children,
  ...rest
}: Base & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      <select className={cn("field appearance-auto", error && "border-danger")} {...rest}>
        {children}
      </select>
    </Field>
  );
}

export function Checkbox({
  label,
  className,
  ...rest
}: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 text-sm", className)}>
      <input type="checkbox" className="size-4 accent-foreground" {...rest} />
      {label}
    </label>
  );
}
