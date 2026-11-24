import type { CategoryId, ImageWorkflow, NewsItem } from "./types";

export const categories: { id: CategoryId; name: string; description: string; example: string }[] = [
  { id: "images", name: "Image creation", description: "Campaign visuals, photo edits, and artwork with text", example: "Create a banner image for a managed services campaign" },
  { id: "marketing", name: "Marketing & sales", description: "Campaign copy, proposals, and sales enablement", example: "Draft a LinkedIn post introducing our onboarding service" },
  { id: "presentations", name: "Presentations", description: "Slide outlines, stories, and speaker notes", example: "Outline a five-slide deck for a customer review" },
  { id: "analysis", name: "Data & spreadsheets", description: "Formulas, chart interpretation, and data summaries", example: "Summarize trends in a spreadsheet of monthly renewals" },
  { id: "writing", name: "Writing", description: "Clear documentation and customer communication", example: "Turn incident notes into a concise customer update" },
  { id: "research", name: "Research", description: "Make sense of sources and technical tradeoffs", example: "Research the tradeoffs between two backup platforms" },
  { id: "coding", name: "Coding", description: "Scripts, features, and everyday automation", example: "Write a PowerShell script to summarize device inventory" },
  { id: "debugging", name: "Debugging", description: "Find the cause, not just another workaround", example: "Debug an intermittent failure in a deployment script" },
  { id: "networking", name: "Networking", description: "Configurations, migrations, and infrastructure", example: "Compare two approaches to a network migration" },
  { id: "security", name: "Cybersecurity", description: "Understand evidence and strengthen defenses", example: "Analyze sanitized SIEM alerts and suggest investigation steps" },
];
export const imageWorkflows: { id: ImageWorkflow; name: string; description: string }[] = [
  { id: "concepts", name: "Create a new image", description: "Campaign concepts, illustrations, and social or website visuals" },
  { id: "edits", name: "Edit an existing image", description: "Controlled changes to a product photo, background, or composition" },
  { id: "layout", name: "Design with text", description: "Poster concepts, headings, and artwork with short labels" },
];
export const tierLabels = { everyday: "Everyday", balanced: "Balanced", deep: "Deep work" };
export function sortNews(items: NewsItem[]) {
  return [...items].sort((a, b) => (b.primarySource.publishedDate || "").localeCompare(a.primarySource.publishedDate || ""));
}
export function displayDate(date: string) {
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(value);
}
