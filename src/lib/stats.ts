export type Level = "ok" | "low" | "empty" | "na";

export type Stats = {
  lessonCount: number;
  hours: number;
  paidCents: number;
  lessonsAdded: number;
  hoursAdded: number;
  remaining: number | null;
  owedCents: number;
  level: Level;
};

export type Tone = "ok" | "low" | "empty" | "due" | "neutral";

type LooseT = (key: string, values?: Record<string, string | number>) => string;

export function summarize(
  mode: string,
  priceCents: number,
  lessonCount: number,
  paidCents: number,
  lessonsAdded: number,
  hours = lessonCount,
  hoursAdded = 0,
): Stats {
  const shared = { lessonCount, hours, paidCents, lessonsAdded, hoursAdded };
  if (mode === "prepaid") {
    const remaining = lessonsAdded - lessonCount;
    const level: Level = remaining <= 1 ? "empty" : remaining === 2 ? "low" : "ok";
    return { ...shared, remaining, owedCents: 0, level };
  }

  const units = mode === "per_hour" ? hours : lessonCount;
  return {
    ...shared,
    remaining: null,
    owedCents: Math.round(units * priceCents) - paidCents,
    level: "na",
  };
}

export function describePack(mode: string, stats: Stats, t: LooseT): { text: string; tone: Tone } {
  const byHour = mode === "per_hour";
  const used = byHour ? stats.hours : stats.lessonCount;
  const added = byHour ? stats.hoursAdded : stats.lessonsAdded;
  const over = Math.round((used - added) * 10) / 10;
  if (over > 0) {
    const one = over === 1;
    return {
      text: byHour ? t(one ? "overHour" : "overHours", { count: over }) : t(one ? "overLesson" : "overLessons", { count: over }),
      tone: "empty",
    };
  }
  const left = Math.round((added - used) * 10) / 10;
  if (left === 0) return { text: t("settled"), tone: "neutral" };
  const one = left === 1;
  return {
    text: byHour ? t(one ? "leftHour" : "leftHours", { count: left }) : t(one ? "leftLesson" : "leftLessons", { count: left }),
    tone: left <= 2 ? "low" : "ok",
  };
}

export function urgency(stats: Stats) {
  if (stats.level === "empty") return 0;
  if (stats.level === "low") return 1;
  if (stats.owedCents > 0) return 2;
  return 3;
}

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
