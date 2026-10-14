export function MoodMark({ level, small = false, label }: { level: number; small?: boolean; label?: string }) {
  const kind = ["quiet", "uneven", "steady", "bright", "glad"][Math.min(5, Math.max(1, level)) - 1];
  return (
    <span className={`mood mood-${kind} ${small ? "mood-sm" : ""}`} role="img" aria-label={label}>
      <span className="mood-body" />
    </span>
  );
}

export function MoodScale({
  name,
  label,
  marks,
}: {
  name: string;
  label: string;
  marks: { value: number; name: string }[];
}) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex gap-2">
        {marks.map((mark) => (
          <label key={mark.value} className="flex-1">
            <input className="peer sr-only" type="radio" name={name} value={mark.value} required />
            <span className="grid cursor-pointer place-items-center rounded-2xl bg-paper py-2 shadow-[inset_0_0_0_1px_rgba(17,17,17,0.08)] transition peer-checked:bg-ivory peer-checked:shadow-[inset_0_0_0_1.5px_#111] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-ink">
              <MoodMark level={mark.value} label={mark.name} />
              <span className="sr-only">{mark.name}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
