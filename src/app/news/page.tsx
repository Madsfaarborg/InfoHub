import type { Metadata } from "next";
import { NewsFeed } from "@/components/news-feed";
import { readCatalog } from "@/lib/repository";
import { sortNews } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "News" };
export default async function NewsPage() {
  const { bundle, warning } = await readCatalog();
  const items = sortNews(bundle.news);
  return <div className="content-width page-content">{warning ? <p className="catalog-warning" role="status">{warning}</p> : null}<header className="page-heading"><span className="eyebrow"><span className="accent-line" />From the field</span><h1>Worth knowing.<br />Relevant to your work.</h1><p>Selected updates on models, tools, and the infrastructure<br className="desktop-break" /> around them. With a reason to pay attention.</p></header><NewsFeed items={items} /><div className="editorial-note"><strong>A small, considered feed.</strong><p>Every note links to its source. Provider claims are labeled, and updates that could change a model recommendation are reviewed separately.</p></div></div>;
}
