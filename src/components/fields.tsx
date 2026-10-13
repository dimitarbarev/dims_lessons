export const primaryButton =
  "btn btn-ink inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-medium tracking-tight";

export const butterButton = "nav-link inline-flex min-h-10 items-center text-[15px] text-ink/80 hover:text-ink";

export function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
  hint,
  optional,
  inputMode,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  hint?: string;
  optional?: string;
  inputMode?: "decimal" | "numeric" | "tel" | "email" | "text";
}) {
  return (
    <label className="block">
      <span className="label">
        {label}
        {optional ? <span className="ml-2 font-semibold text-soft">{optional}</span> : null}
      </span>
      {hint ? <span className="mb-1.5 block text-xs text-soft">{hint}</span> : null}
      <input
        className="field"
        name={name}
        defaultValue={defaultValue}
        required={required}
        type={type}
        inputMode={inputMode}
      />
    </label>
  );
}

export function Area({
  label,
  name,
  defaultValue,
  hint,
  optional,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  hint?: string;
  optional?: string;
}) {
  return (
    <label className="block">
      <span className="label">
        {label}
        {optional ? <span className="ml-2 font-semibold text-soft">{optional}</span> : null}
      </span>
      {hint ? <span className="mb-1.5 block text-xs text-soft">{hint}</span> : null}
      <textarea className="field min-h-28" name={name} defaultValue={defaultValue} />
    </label>
  );
}

export function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select className="field" name={name} defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
