import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { TaskFinder } from "@/components/task-finder";
import { NewsList } from "@/components/news-list";
import { readCatalog } from "@/lib/repository";
import { sortNews } from "@/lib/categories";

export const dynamic = "force-dynamic";
export default async function HomePage() {
  const { bundle, warning } = await readCatalog();
  return <>{warning ? <p className="catalog-warning" role="status">{warning}</p> : null}<TaskFinder models={bundle.models} />
    {bundle.models.some(model => model.reportedBenchmarks) ? (
      <section className="content-width" aria-label="Model benchmarks">
        <Link className="text-button" href="/compare#reported-benchmarks">Compare provider benchmark scores <ArrowRight size={16} aria-hidden="true" /></Link>
      </section>
    ) : null}
    <section className="guidance-section content-width"><div className="guidance-copy"><span className="eyebrow">Spend thoughtfully</span><h2>Start small.<br />Step up with a reason.</h2><p>A quick script and a stubborn bug don’t need the same approach. Start with a sensible choice, then spend more when the work calls for it.</p><Link href="/about" className="text-button">How we choose <ArrowRight size={16} /></Link></div><div className="tier-guide"><div><span className="tier-number">01</span><span><strong>Everyday</strong><p>Clear task. Familiar ground.</p></span><span className="tier-cost">$</span></div><div><span className="tier-number">02</span><span><strong>Balanced</strong><p>A little more to work through.</p></span><span className="tier-cost">$$</span></div><div><span className="tier-number">03</span><span><strong>Deep work</strong><p>Complex problems. Room to investigate.</p></span><span className="tier-cost">$$$</span></div></div></section>
    <section className="home-news content-width"><div className="section-heading"><h2>Latest for your work</h2><Link className="text-button" href="/news">All news <ArrowRight size={16} /></Link></div>{bundle.news.length ? <NewsList items={sortNews(bundle.news).slice(0, 3)} /> : <div className="quiet-note"><p>Verified updates will appear here as they’re published.</p><Link href="/about">How recommendations work <ArrowUpRight size={15} /></Link></div>}</section>
  </>;
}
