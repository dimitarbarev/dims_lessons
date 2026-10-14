"use client";

import { useState } from "react";
import { Field } from "@/components/fields";

export function BillingFields({
  billingLabel,
  priceLabel,
  priceHourLabel,
  packLessonsLabel,
  packHoursLabel,
  options,
  defaultBilling = "per_lesson",
}: {
  billingLabel: string;
  priceLabel: string;
  priceHourLabel: string;
  packLessonsLabel: string;
  packHoursLabel: string;
  options: { value: string; label: string }[];
  defaultBilling?: string;
}) {
  const [mode, setMode] = useState(defaultBilling === "per_hour" ? "per_hour" : "per_lesson");
  const byHour = mode === "per_hour";

  return (
    <>
      <label className="block">
        <span className="label">{billingLabel}</span>
        <select className="field" name="billing" value={mode} onChange={(event) => setMode(event.target.value)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <Field label={byHour ? priceHourLabel : priceLabel} name="price" defaultValue="0" inputMode="decimal" />
      <Field
        label={byHour ? packHoursLabel : packLessonsLabel}
        name="packSize"
        defaultValue="0"
        inputMode={byHour ? "decimal" : "numeric"}
      />
    </>
  );
}
