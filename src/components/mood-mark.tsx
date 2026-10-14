const FACES = ["/mood-head-1.png", "/mood-head-2.png", "/mood-head-3.png", "/mood-head-4.png", "/mood-head-5.png"] as const;

export function MoodMark({
  level,
  small = false,
  large = false,
  label,
}: {
  level: number;
  small?: boolean;
  large?: boolean;
  label?: string;
}) {
  const src = FACES[Math.min(5, Math.max(1, level)) - 1];
  return (
    <span className={`mood ${small ? "mood-sm" : ""} ${large ? "mood-lg" : ""}`} role="img" aria-label={label}>
      <img src={src} alt="" width={286} height={332} draggable={false} />
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
            <span className="grid w-full cursor-pointer place-items-center overflow-visible rounded-2xl bg-paper px-2 py-2 shadow-[inset_0_0_0_1px_rgba(17,17,17,0.08)] transition peer-checked:bg-ivory peer-checked:shadow-[inset_0_0_0_1.5px_#111] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-ink">
              <MoodMark level={mark.value} large label={mark.name} />
              <span className="sr-only">{mark.name}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
