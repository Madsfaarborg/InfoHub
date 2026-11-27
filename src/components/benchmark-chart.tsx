"use client";

import { useState } from "react";
import Link from "next/link";
import { Dropdown } from "./dropdown";
import { groupModelFamilies } from "@/lib/model-families";
import { estimateCost, formatUsd, priceIsStale } from "@/lib/cost";
import type { BenchmarkMetricId, ModelVariant } from "@/lib/types";

const metrics = [
  { value: "coding", label: "Coding · FrontierCode-AA 2.0" },
  { value: "agentic", label: "Agentic work · AutomationBench-AA" },
  { value: "instructionFollowing", label: "Instruction following · GDP.pdf" },
  { value: "intelligence", label: "Overall intelligence · Intelligence Index" },
] as const;

export function BenchmarkChart({ models, inputTokens, outputTokens, cachedTokens, validInputs, editWorkload }: { models: ModelVariant[]; inputTokens: number; outputTokens: number; cachedTokens: number; validInputs: boolean; editWorkload: () => void }) {
  const [metric, setMetric] = useState<BenchmarkMetricId>("coding");
  const [version, setVersion] = useState("Artificial Analysis Intelligence Index v5.0.2");
  const [active, setActive] = useState<string | null>(null);
  const families = groupModelFamilies(models).filter(family => family.deployment === "hosted" && family.availability === "available" && family.benchmarkProfile);
  const versions = [...new Set(families.flatMap(family => family.benchmarkProfile?.metrics.intelligence?.benchmark ?? []))];
  const candidates = families.flatMap(family => {
    const profile = family.benchmarkProfile;
    const score = profile?.metrics[metric];
    const model = family.variants.find(variant => variant.price.input !== null && variant.price.output !== null);
    if (!profile || !score || !model || (metric === "intelligence" && score.benchmark !== version)) return [];
    const cost = validInputs ? estimateCost(model, { inputTokens, outputTokens, cachedTokens }) : null;
    return cost === null ? [] : [{ family, model, profile, score, cost }];
  });
  const maxX = Math.max(...families.flatMap(family => family.variants.map(model => validInputs ? estimateCost(model, { inputTokens, outputTokens, cachedTokens }) ?? 0 : 0)), 0.001) * 1.1;
  const maxY = metric === "intelligence" ? Math.max(100, ...candidates.map(point => point.score.score)) : 100;
  const selected = candidates.find(point => point.family.id === active);
  return <section className="quality-section">
    <div className="section-heading"><div><h2>Benchmark performance and cost</h2><p>Compare High-effort scores against an estimated sample task.</p></div></div>
    <div className="suite-label"><label htmlFor="benchmark-metric">Benchmark</label><Dropdown id="benchmark-metric" label="Benchmark" value={metric} onChange={value => { setMetric(value as BenchmarkMetricId); setActive(null); }} options={metrics.map(item => ({ ...item }))} /></div>
    {metric === "intelligence" && versions.length > 1 ? <div className="suite-label"><label htmlFor="benchmark-version">Index version</label><Dropdown id="benchmark-version" label="Index version" value={version} onChange={setVersion} options={versions.map(value => ({ value, label: value }))} /></div> : null}
    <p className="small">{inputTokens.toLocaleString()} input tokens, {cachedTokens.toLocaleString()} cached input tokens, {outputTokens.toLocaleString()} billable output tokens. <button className="text-button" onClick={editWorkload}>Edit token assumptions</button></p>
    <p className="small">Estimated cost uses the same token counts for every model. Actual reasoning and output usage vary. {candidates.length} models shown.</p>
    {!validInputs ? <p role="status">Enter valid token counts in the cost calculator.</p> : candidates.length === 0 ? <p role="status">No matching benchmark scores and prices are available.</p> : <div className="scatter-panel"><svg viewBox="0 0 760 370" role="img" aria-label="Estimated API cost against benchmark score. Results are also listed in the table below.">
      {[0, 1, 2, 3, 4].map(i => <g key={i}><line x1="90" x2="700" y1={290-i*55} y2={290-i*55} stroke="var(--line)" /><text x="76" y={295-i*55} textAnchor="end" className="axis-label">{maxY*i/4}</text><text x={90+i*152.5} y="315" textAnchor="middle" className="axis-label">{formatUsd(maxX*i/4)}</text></g>)}
      <text x="395" y="354" textAnchor="middle" className="axis-label">Estimated API cost (USD / sample task)</text><text transform="rotate(-90)" x="-180" y="22" textAnchor="middle" className="axis-label">Score ({metric === "intelligence" ? "index" : "%"})</text>
      {candidates.map(point => <circle key={point.family.id} cx={90+point.cost/maxX*610} cy={290-point.score.score/maxY*220} r="8" fill="var(--accent)" tabIndex={0} role="button" aria-label={`${point.family.name}, ${point.score.score} ${point.score.unit}, ${formatUsd(point.cost)}`} onFocus={() => setActive(point.family.id)} onMouseEnter={() => setActive(point.family.id)} onClick={() => setActive(point.family.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActive(point.family.id); } }}><title>{point.family.name} · {point.profile.effort}</title></circle>)}
    </svg>{selected ? <p role="status"><strong>{selected.family.name}</strong> · {selected.profile.effort} · {selected.score.score} {selected.score.unit} · {formatUsd(selected.cost)}</p> : <p className="small">Select or focus a point to see its details.</p>}</div>}
    <div className="table-scroll"><table><caption>Benchmark scores and estimated sample costs</caption><thead><tr><th>Model and effort</th><th>Score</th><th>Estimated cost</th><th>Sources</th></tr></thead><tbody>{candidates.map(point => <tr key={point.family.id}><th scope="row"><Link href={`/models/${point.model.id}`}>{point.family.name}</Link><small>{point.model.provider} · {point.profile.effort}</small></th><td>{point.score.score} {point.score.unit}</td><td>{formatUsd(point.cost)}{priceIsStale(point.model) ? <small>Historical rate · needs review</small> : null}</td><td><a href={point.score.sourceUrl ?? point.profile.sourceUrl}>Benchmark</a> · <a href={point.model.price.sourceUrl}>Price</a></td></tr>)}</tbody></table></div>
  </section>;
}
