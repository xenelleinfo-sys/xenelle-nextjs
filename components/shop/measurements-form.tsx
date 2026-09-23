"use client";

import { MEASUREMENT_FIELDS, type MeasurementKey } from "@/lib/constants";

export type MeasurementValues = Partial<Record<MeasurementKey, string>>;

export function MeasurementsForm({
  values,
  onChange,
}: {
  values: MeasurementValues;
  onChange: (values: MeasurementValues) => void;
}) {
  return (
    <div className="border border-line bg-soft/60 p-4">
      <p className="mb-3 text-xs text-muted">
        All measurements in <strong>inches</strong>. Fill what you know — we will call to confirm before stitching.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MEASUREMENT_FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">{f.label}</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={200}
              step={0.25}
              value={values[f.key] ?? ""}
              onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
              className="field py-2"
              placeholder="—"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

/** Convert string inputs to numbers; returns null when nothing is filled. */
export function toMeasurements(values: MeasurementValues) {
  const out: Partial<Record<MeasurementKey, number>> = {};
  for (const f of MEASUREMENT_FIELDS) {
    const n = Number.parseFloat(values[f.key] ?? "");
    if (Number.isFinite(n) && n > 0) out[f.key] = n;
  }
  return Object.keys(out).length ? out : null;
}
