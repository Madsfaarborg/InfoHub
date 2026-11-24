import { ArrowUpRight } from "lucide-react";
import type { NewsItem } from "@/lib/types";
import { displayDate } from "@/lib/categories";

export function NewsList({ items }: { items: NewsItem[] }) {
  return <div className="news-list">{items.map(item => <article className="news-row" key={item.eventKey}>
    <div className="news-meta"><span>{item.primarySource.publisher}</span><time dateTime={item.primarySource.publishedDate || undefined}>{item.primarySource.publishedDate ? displayDate(item.primarySource.publishedDate) : "Publication date unavailable"}</time></div>
    <div className="news-body"><h3><a href={item.primarySource.url} target="_blank" rel="noreferrer">{item.title}<ArrowUpRight size={18} aria-hidden="true" /></a></h3><p>{item.summary}</p><details><summary>Why it matters for your work</summary><div><p>{item.whyItMatters}</p><p><strong>Next step:</strong> {item.suggestedAction}</p>{item.confidence === "vendor-claim" ? <p className="small">This is a provider claim, not an independent evaluation.</p> : null}{item.additionalSources.map(source => <a key={source.url} className="additional-source" href={source.url} target="_blank" rel="noreferrer">{source.publisher} <ArrowUpRight size={12} /></a>)}</div></details></div>
    {item.urgency === "time-sensitive" ? <span className="time-sensitive">Time-sensitive</span> : null}
  </article>)}</div>;
}
