import type { CategoryId, NewsItem } from "./types";

export const categories: { id: CategoryId; name: string; description: string; example: string }[] = [
  { id: "coding", name: "Coding", description: "Scripts, features, and everyday automation", example: "Write a PowerShell script to summarize device inventory" },
  { id: "debugging", name: "Debugging", description: "Find the cause, not just another workaround", example: "Debug an intermittent failure in a deployment script" },
  { id: "networking", name: "Networking", description: "Configurations, migrations, and infrastructure", example: "Compare two approaches to a network migration" },
  { id: "security", name: "Cybersecurity", description: "Understand evidence and strengthen defenses", example: "Analyze sanitized SIEM alerts and suggest investigation steps" },
  { id: "research", name: "Research", description: "Make sense of sources and technical tradeoffs", example: "Research the tradeoffs between two backup platforms" },
  { id: "writing", name: "Writing", description: "Clear documentation and customer communication", example: "Turn incident notes into a concise customer update" },
];
export const tierLabels = { everyday: "Everyday", balanced: "Balanced", deep: "Deep work" };
export function sortNews(items: NewsItem[]) {
  return [...items].sort((a, b) => (b.primarySource.publishedDate || "").localeCompare(a.primarySource.publishedDate || ""));
}
export function displayDate(date: string) {
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(value);
}
