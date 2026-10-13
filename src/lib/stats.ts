export type Level = "ok" | "low" | "empty" | "na";

export type Stats = {
  lessonCount: number;
  paidCents: number;
  lessonsAdded: number;
  remaining: number | null;
  owedCents: number;
  level: Level;
};

export type Tone = "ok" | "low" | "empty" | "due" | "neutral";

export function summarize(
  mode: string,
  priceCents: number,
  lessonCount: number,
  paidCents: number,
  lessonsAdded: number,
): Stats {
  if (mode === "prepaid") {
    const remaining = lessonsAdded - lessonCount;
    const level: Level = remaining <= 1 ? "empty" : remaining === 2 ? "low" : "ok";
    return {
      lessonCount,
      paidCents,
      lessonsAdded,
      remaining,
      owedCents: 0,
      level,
    };
  }

  return {
    lessonCount,
    paidCents,
    lessonsAdded,
    remaining: null,
    owedCents: lessonCount * priceCents - paidCents,
    level: "na",
  };
}

export function urgency(stats: Stats) {
  if (stats.level === "empty") return 0;
  if (stats.level === "low") return 1;
  if (stats.owedCents > 0) return 2;
  return 3;
}

type LooseT = (key: string, values?: Record<string, string | number>) => string;

export function describeStats(
  stats: Stats,
  t: LooseT,
  money: (cents: number) => string,
): { text: string; tone: Tone } {
  if (stats.remaining !== null) {
    if (stats.remaining < 0) {
      return { text: t("over", { count: Math.abs(stats.remaining) }), tone: "empty" };
    }
    if (stats.remaining === 0) return { text: t("noneLeft"), tone: "empty" };
    if (stats.remaining === 1) return { text: t("leftOne"), tone: "empty" };
    if (stats.remaining === 2) return { text: t("leftMany", { count: 2 }), tone: "low" };
    return { text: t("leftMany", { count: stats.remaining }), tone: "ok" };
  }

  if (stats.owedCents > 0) return { text: t("owed", { amount: money(stats.owedCents) }), tone: "due" };
  if (stats.owedCents < 0) {
    return { text: t("credit", { amount: money(-stats.owedCents) }), tone: "ok" };
  }
  return { text: t("settled"), tone: "neutral" };
}
