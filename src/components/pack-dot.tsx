import type { Tone } from "@/lib/stats";

const toneClass: Record<Tone, string> = {
  ok: "bg-sage",
  low: "bg-amber",
  empty: "bg-coral pack-hot",
  due: "bg-apricot",
  neutral: "bg-butter",
};

export function PackDot({ tone }: { tone: Tone }) {
  return <span className={`inline-block size-3 shrink-0 rounded-full ${toneClass[tone]}`} aria-hidden="true" />;
}

export function StatusLine({ text, tone }: { text: string; tone: Tone }) {
  return (
    <p className="mt-1 flex items-center gap-2 text-sm font-bold">
      <PackDot tone={tone} />
      <span>{text}</span>
    </p>
  );
}
