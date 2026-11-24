import type { ModelVariant } from "./types";

export function estimateCost(model: ModelVariant, usage: { inputTokens: number; outputTokens: number; cachedTokens: number }): number | null {
  const { inputTokens, outputTokens, cachedTokens } = usage;
  if (![inputTokens, outputTokens, cachedTokens].every((value) => Number.isSafeInteger(value) && value >= 0) || cachedTokens > inputTokens) return null;
  const rates = [[inputTokens - cachedTokens, model.price.input], [cachedTokens, model.price.cachedInput], [outputTokens, model.price.output]] as const;
  let total = 0;
  for (const [tokens, rate] of rates) {
    if (tokens === 0) continue;
    if (rate === null || !Number.isFinite(rate) || rate < 0) return null;
    total += tokens * rate / 1_000_000;
  }
  return Number.isFinite(total) ? total : null;
}

export function priceIsStale(model: ModelVariant, now: Date = new Date()): boolean {
  const timestamp = model.price.verifiedAt;
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(timestamp)) return true;
  if (timestamp.includes("T") && (Number(timestamp.slice(11, 13)) > 23 || Number(timestamp.slice(14, 16)) > 59 || Number(timestamp.slice(17, 19)) > 59)) return true;
  const verified = Date.parse(timestamp);
  const day = model.price.verifiedAt.slice(0, 10);
  const calendar = new Date(`${day}T00:00:00Z`);
  const invalidCalendar = !Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== day;
  return invalidCalendar || !Number.isFinite(verified) || !Number.isFinite(now.getTime()) || verified > now.getTime() || now.getTime() - verified > 7 * 24 * 60 * 60 * 1000;
}

export function formatUsd(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "Unknown";
  if (value > 0 && value < 0.0001) return "<$0.0001";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value);
}
