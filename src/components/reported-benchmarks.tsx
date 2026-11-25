import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { displayDate } from "@/lib/categories";
import type { ModelVariant } from "@/lib/types";

export function ReportedBenchmarks({ models }: { models: ModelVariant[] }) {
  const groups = Map.groupBy(
    models.flatMap(model => model.reportedBenchmarks ? [{ model, report: model.reportedBenchmarks }] : []),
    ({ report }) => JSON.stringify([report.sourceUrl, report.publishedAt]),
  );
  if (!groups.size) return null;

  return (
    <section id="reported-benchmarks" className="comparison-table-section" aria-labelledby="reported-benchmarks-title">
      <div className="section-heading">
        <div>
          <h2 id="reported-benchmarks-title">Provider benchmarks</h2>
          <p>Each score reflects the listed test conditions.</p>
        </div>
      </div>
      {[...groups].map(([key, entries]) => {
        const report = entries[0].report;
        const names = new Set(entries.flatMap(entry => entry.report.results.map(result => result.name)));
        return (
          <div key={key}>
            <div className="table-scroll">
              <table>
                <caption className="sr-only">{report.sourceLabel}</caption>
                <thead>
                  <tr>
                    <th scope="col">Benchmark</th>
                    {entries.map(({ model }) => (
                      <th scope="col" key={model.id}>
                        {models.length === 1 ? model.name : <Link href={"/models/" + model.id}>{model.name}</Link>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...names].map(name => (
                    <tr key={name}>
                      <th scope="row">{name}</th>
                      {entries.map(({ model, report }) => {
                        const result = report.results.find(item => item.name === name);
                        return (
                          <td key={model.id}>
                            {result ? <>{`${result.percent}%`}{result.conditions ? <small>{result.conditions}</small> : null}</> : "Unreported"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="results-footnote">
              Published {displayDate(report.publishedAt)} ·{" "}
              <a className="inline-link" href={report.sourceUrl} target="_blank" rel="noreferrer">
                {report.sourceLabel} <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            </p>
          </div>
        );
      })}
    </section>
  );
}
