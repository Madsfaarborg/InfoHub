import type { Metadata } from "next";
import { Comparison } from "@/components/comparison";
import { ReportedBenchmarks } from "@/components/reported-benchmarks";
import { readCatalog } from "@/lib/repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Compare models" };
export default async function ComparePage() {
  const { bundle, warning } = await readCatalog();
  return (
    <div className="content-width page-content">
      {warning ? <p className="catalog-warning" role="status">{warning}</p> : null}
      <header className="page-heading">
        <span className="eyebrow"><span className="accent-line" />Put the tradeoffs in perspective</span>
        <h1>A clearer view<br />of what you’re paying for.</h1>
        <p>Explore the cost of a task and the evidence behind model performance.</p>
        {bundle.models.some(model => model.reportedBenchmarks) ? <a className="text-button" href="#reported-benchmarks">Jump to provider benchmarks</a> : null}
      </header>
      <Comparison models={bundle.models} benchmarks={bundle.benchmarks} />
      <ReportedBenchmarks models={bundle.models} />
    </div>
  );
}
