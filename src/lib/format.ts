export function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function formatDay(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "bg" ? "bg-BG" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${iso.slice(0, 10)}T12:00:00`));
}

export function formatMoney(cents: number, currency: string, locale: string) {
  const code = currency === "BGN" ? "BGN" : "EUR";
  return new Intl.NumberFormat(locale === "bg" ? "bg-BG" : "en-GB", {
    style: "currency",
    currency: code,
  }).format(cents / 100);
}

export function parseMoney(raw: string): number | null {
  const cleaned = raw.trim().replace(",", ".");
  if (!cleaned) return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number.parseFloat(cleaned) * 100);
}

export function parseCount(raw: string): number | null {
  const cleaned = raw.trim();
  if (!cleaned) return 0;
  if (!/^\d+$/.test(cleaned)) return null;
  return Number.parseInt(cleaned, 10);
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
