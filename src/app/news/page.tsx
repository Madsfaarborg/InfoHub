import type { Metadata } from "next";
import { NewsFeed } from "@/components/news-feed";
import { readCatalog } from "@/lib/repository";
import { sortNews } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "News" };
export default async function NewsPage() {
  const { bundle, warning } = await readCatalog();
  const items = sortNews(bundle.news);
  return <div className="content-width page-content">{warning ? <p className="catalog-warning" role="status">{warning}</p> : null}<header className="page-heading"><h1>AI news for work</h1><p>Updates on creative and business tools, models, security, and infrastructure.</p></header><NewsFeed items={items} /><div className="editorial-note"><p>Every note links to its source. Provider claims are labeled, and updates that could change a model recommendation are reviewed separately.</p></div></div>;
}
