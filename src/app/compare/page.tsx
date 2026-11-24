import type { Metadata } from "next";
import { Comparison } from "@/components/comparison";
import { readCatalog } from "@/lib/repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Compare models" };
export default async function ComparePage() {
  const { bundle, warning } = await readCatalog();
  return <div className="content-width page-content">{warning ? <p className="catalog-warning" role="status">{warning}</p> : null}<header className="page-heading"><span className="eyebrow"><span className="accent-line" />Put the tradeoffs in perspective</span><h1>A clearer view<br />of what you’re paying for.</h1><p>Explore the cost of a task, understand the assumptions,<br className="desktop-break" /> and look closer before paying for more.</p></header><Comparison models={bundle.models} benchmarks={bundle.benchmarks} /></div>;
}
