"use client";

import Link from "next/link";
import { ViewTransition, useMemo, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Search } from "lucide-react";
import type { BenchmarkMetricId, ModelBenchmarkProfile } from "@/lib/types";
import { useReveal } from "./motion";
import { Dropdown } from "./dropdown";

export interface ModelCatalogRow {
  id: string;
  name: string;
  developer: string;
  provider: string;
  variants: string[];
  codingDefault: string | null;
  benchmarkProfile: ModelBenchmarkProfile | null;
}

type SortKey = "name" | "codingDefault" | BenchmarkMetricId;

const benchmarkColumns: { key: BenchmarkMetricId; label: string; benchmark: string }[] = [
  { key: "coding", label: "Coding", benchmark: "FrontierCode-AA 2.0" },
  { key: "agentic", label: "Agentic", benchmark: "AutomationBench-AA" },
  { key: "instructionFollowing", label: "Instructions", benchmark: "GDP.pdf" },
  { key: "intelligence", label: "Intelligence", benchmark: "AA Index v5" },
];

export function ModelCatalogTable({ rows }: { rows: ModelCatalogRow[] }) {
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("all");
  const [coverage, setCoverage] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({ key: "intelligence", direction: "desc" });
  const tableMotion = useReveal<HTMLDivElement>([provider, coverage, sort]);
  const providers = useMemo(() => [...new Set(rows.map(row => row.developer))].sort((a, b) => a.localeCompare(b)), [rows]);

  const visibleRows = useMemo(() => {
    const words = query.trim().toLocaleLowerCase("en").split(/\s+/).filter(Boolean);
    return rows.filter(row => {
      const searchText = [row.name, row.developer, row.provider, ...row.variants].join(" ").toLocaleLowerCase("en");
      if (!words.every(word => searchText.includes(word))) return false;
      if (provider !== "all" && row.developer !== provider) return false;
      if (coverage === "benchmarked" && !row.benchmarkProfile) return false;
      if (coverage === "coding" && !row.codingDefault) return false;
      return true;
    }).sort((a, b) => compareRows(a, b, sort.key, sort.direction));
  }, [coverage, provider, query, rows, sort]);

  function updateSort(key: SortKey) {
    setSort(current => current.key === key
      ? { key, direction: current.direction === "desc" ? "asc" : "desc" }
      : { key, direction: key === "name" ? "asc" : "desc" });
  }

  return (
    <section className="model-table-section" aria-labelledby="model-table-title">
      <div className="section-heading model-table-heading">
        <div>
          <h2 id="model-table-title">Language model comparison</h2>
          <p>One row per model family. Benchmark results use High effort; unavailable results are left blank.</p>
        </div>
        <span className="small muted">{visibleRows.length} of {rows.length} models</span>
      </div>
      <div className="model-table-controls">
        <label className="model-table-search">
          <span className="sr-only">Search models</span>
          <Search size={16} aria-hidden="true" />
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search models" />
        </label>
        <Dropdown label="Filter by developer" value={provider} onChange={setProvider} options={[{ value: "all", label: "All developers" }, ...providers.map(item => ({ value: item, label: item }))]} />
        <Dropdown label="Filter by coverage" value={coverage} onChange={setCoverage} options={[{ value: "all", label: "All coverage" }, { value: "benchmarked", label: "Benchmarked models" }, { value: "coding", label: "Coding models" }]} />
      </div>
      {visibleRows.length ? (
        <div ref={tableMotion} className="model-table-scroll">
          <table className="model-catalog-table">
            <caption className="sr-only">Language models with coding defaults and independent benchmark results</caption>
            <thead>
              <tr>
                <SortableHeading label="Model" sortKey="name" activeSort={sort} onSort={updateSort} />
                <th scope="col">Benchmark effort</th>
                {benchmarkColumns.map(column => (
                  <SortableHeading key={column.key} label={column.label} detail={column.benchmark} sortKey={column.key} activeSort={sort} onSort={updateSort} />
                ))}
                <th scope="col" aria-label="Open model" />
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(row => (
                <tr className="model-table-row" key={row.id}>
                  <th scope="row">
                    <Link className="model-table-model" href={`/models/${row.id}`}>
                      <ViewTransition name={"model-" + row.id} default="none" share="model-identity"><strong>{row.name}</strong></ViewTransition>
                      <span>{row.developer} · {row.variants.length} {row.variants.length === 1 ? "configuration" : "configurations"}</span>
                    </Link>
                  </th>
                  <td>
                    <span className="effort-value">{row.benchmarkProfile?.effort ?? "Unavailable"}</span>
                    {!row.benchmarkProfile ? <small>No verified High result</small> : null}
                  </td>
                  {benchmarkColumns.map(column => <BenchmarkCell key={column.key} profile={row.benchmarkProfile} metric={column.key} />)}
                  <td className="model-table-open"><ArrowRight size={16} aria-hidden="true" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="model-table-empty">No models match these filters.</p>}
      <p className="results-footnote model-table-note">
        Coding, agentic, and instruction-following columns use separate evaluations; they are not blended into a made-up score. A dash means no comparable result is currently published in InfoHub.
      </p>
    </section>
  );
}

function SortableHeading({ label, detail, sortKey, activeSort, onSort }: {
  label: string;
  detail?: string;
  sortKey: SortKey;
  activeSort: { key: SortKey; direction: "asc" | "desc" };
  onSort: (key: SortKey) => void;
}) {
  const active = activeSort.key === sortKey;
  return (
    <th scope="col" aria-sort={active ? activeSort.direction === "asc" ? "ascending" : "descending" : "none"}>
      <button className="table-sort" type="button" onClick={() => onSort(sortKey)}>
        <span>{label}{detail ? <small>{detail}</small> : null}</span>
        {active ? activeSort.direction === "asc" ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" /> : null}
      </button>
    </th>
  );
}

function BenchmarkCell({ profile, metric }: { profile: ModelBenchmarkProfile | null; metric: BenchmarkMetricId }) {
  const result = profile?.metrics[metric];
  if (!result || !profile) return <td><span className="empty-value">—</span><small>Not reported</small></td>;
  return (
    <td title={`${result.benchmark} · ${profile.effort} · ${profile.sourceLabel}`}>
      <span className="benchmark-value">{result.score.toLocaleString("en", { maximumFractionDigits: 1 })}{result.unit === "%" ? "%" : ""}</span>
      <small>{profile.effort}</small>
    </td>
  );
}

function compareRows(first: ModelCatalogRow, second: ModelCatalogRow, key: SortKey, direction: "asc" | "desc") {
  const multiplier = direction === "asc" ? 1 : -1;
  if (key === "name") return multiplier * first.name.localeCompare(second.name, "en", { numeric: true });
  if (key === "codingDefault") {
    if (first.codingDefault === null && second.codingDefault === null) return first.name.localeCompare(second.name, "en", { numeric: true });
    if (first.codingDefault === null) return 1;
    if (second.codingDefault === null) return -1;
    const result = first.codingDefault.localeCompare(second.codingDefault, "en");
    return multiplier * result || first.name.localeCompare(second.name, "en", { numeric: true });
  }
  const firstValue = first.benchmarkProfile?.metrics[key]?.score;
  const secondValue = second.benchmarkProfile?.metrics[key]?.score;
  if (firstValue === undefined && secondValue === undefined) return first.name.localeCompare(second.name, "en", { numeric: true });
  if (firstValue === undefined) return 1;
  if (secondValue === undefined) return -1;
  return multiplier * (firstValue - secondValue) || first.name.localeCompare(second.name, "en", { numeric: true });
}

