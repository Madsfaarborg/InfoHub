"use client";
import { useState } from "react";
import type { NewsItem, NewsTag } from "@/lib/types";
import { NewsList } from "./news-list";

const filters: { id: NewsTag | "all"; label: string }[] = [{ id: "all", label: "All notes" }, { id: "models-and-pricing", label: "Models & pricing" }, { id: "coding-tools", label: "Coding" }, { id: "networking", label: "Networking" }, { id: "cybersecurity", label: "Cybersecurity" }, { id: "microsoft-and-cloud", label: "Microsoft & cloud" }];
export function NewsFeed({ items }: { items: NewsItem[] }) {
  const [filter, setFilter] = useState<NewsTag | "all">("all");
  const filtered = filter === "all" ? items : items.filter(item => item.tags.includes(filter));
  return <><div className="filter-tabs" aria-label="Filter field notes">{filters.map(item => <button key={item.id} aria-pressed={filter === item.id} className={filter === item.id ? "active" : ""} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>{filtered.length ? <NewsList items={filtered} /> : <div className="empty-panel"><h2>{items.length ? "Nothing in this category yet." : "Good information is worth waiting for."}</h2><p>{items.length ? "Explore the other notes, or check back after the next editorial update." : "No news has been published yet. This space will hold verified updates with a clear connection to your work."}</p></div>}</>;
}
