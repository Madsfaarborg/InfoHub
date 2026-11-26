"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Info, ArrowRight } from "lucide-react";
import type { BenchmarkPoint, ModelVariant } from "@/lib/types";
import { estimateCost, formatUsd, priceIsStale } from "@/lib/cost";
import { displayDate } from "@/lib/categories";
import { Dropdown } from "./dropdown";

export function Comparison({ models, benchmarks }: { models: ModelVariant[]; benchmarks: BenchmarkPoint[] }) {
  const options = models.filter(model => !model.image && model.deployment === "hosted" && model.availability === "available");
  const [selected, setSelected] = useState(() => {
    const unique = new Set<string>();
    return options.filter(model => {
      const key = JSON.stringify([model.provider, model.modelId]);
      if (unique.has(key)) return false;
      unique.add(key);
      return true;
    }).slice(0, 4).map(model => model.id);
  });
  const [inputTokens, setInputTokens] = useState(5000);
  const [outputTokens, setOutputTokens] = useState(1000);
  const [cachedTokens, setCachedTokens] = useState(0);
  const [mode, setMode] = useState<"cost" | "quality">("cost");
  const selectedModels = options.filter(model => selected.includes(model.id));
  const validInputs = [inputTokens, outputTokens, cachedTokens].every(value => Number.isFinite(value) && value >= 0 && Number.isInteger(value)) && inputTokens <= 100000 && outputTokens <= 64000 && cachedTokens <= inputTokens;
  const rows = selectedModels.map(model => ({ model, cost: validInputs ? estimateCost(model, { inputTokens, outputTokens, cachedTokens }) : null })).sort((a, b) => (a.cost ?? Infinity) - (b.cost ?? Infinity));
  const maxCost = Math.max(...rows.map(row => row.cost ?? 0), 0.001);
  const suites = [...new Set(benchmarks.map(point => point.suite + " · " + point.version + " · " + point.unit + " · " + (point.higherIsBetter ? "higher" : "lower")))];
  const [suite, setSuite] = useState(suites[0] || "");
  const plot = benchmarks.filter(point => point.suite + " · " + point.version + " · " + point.unit + " · " + (point.higherIsBetter ? "higher" : "lower") === suite);
  function toggle(id: string) {
    setSelected(current => current.includes(id) ? current.filter(value => value !== id) : current.length < 4 ? [...current, id] : current);
  }
  return <>
    <div className="compare-switch" aria-label="Comparison type"><button className={mode === "cost" ? "active" : ""} aria-pressed={mode === "cost"} onClick={() => setMode("cost")}>Cost calculator</button><button className={mode === "quality" ? "active" : ""} aria-pressed={mode === "quality"} onClick={() => setMode("quality")}>Cost vs. quality</button></div>
    {mode === "cost" ? <>
      <div className="comparison-layout">
        <aside className="comparison-settings"><h2>Your sample task</h2><p>Same token budget. Different price tags.</p>
          <label htmlFor="input-tokens">Input tokens <span>Your prompt and context</span></label><input id="input-tokens" type="number" min="0" max="100000" step="100" value={inputTokens} onChange={event => setInputTokens(Number(event.target.value))} />
          <label htmlFor="output-tokens">Output tokens <span>All billable output, including reasoning</span></label><input id="output-tokens" type="number" min="0" max="64000" step="100" value={outputTokens} onChange={event => setOutputTokens(Number(event.target.value))} />
          <label htmlFor="cached-tokens">Cached input tokens <span>Included in your input total</span></label><input id="cached-tokens" type="number" min="0" max={inputTokens} step="100" value={cachedTokens} onChange={event => setCachedTokens(Number(event.target.value))} />
          {!validInputs ? <p className="field-error" role="status">Use whole, non-negative token counts. Cached input cannot exceed input. Maximum: 100,000 input and 64,000 output tokens.</p> : null}
          <div className="settings-divider" /><h3>Models to compare</h3><p className="small">Choose up to four</p>
          <div className="model-checkboxes">{options.map(model => <label key={model.id}><input type="checkbox" checked={selected.includes(model.id)} disabled={!selected.includes(model.id) && selected.length >= 4} onChange={() => toggle(model.id)} /><span>{model.name}<small>{model.setting.label} · {model.provider}</small></span></label>)}</div>
        </aside>
        <section className="cost-chart" aria-labelledby="chart-title">
          <div className="chart-heading"><div><span className="eyebrow">A like-for-like token estimate</span><h2 id="chart-title">What would this task cost?</h2></div><span className="chart-unit">USD / task</span></div>
          <p className="chart-intro">A useful starting point for cost. Not a measure of quality.</p>
          <div className="bar-chart">{rows.length ? rows.map(({ model, cost }, index) => <div className="bar-row" key={model.id}><div className="bar-label"><span>{model.name}</span><strong>{cost === null ? "Unavailable" : formatUsd(cost)}</strong></div><div className="bar-track" role="img" aria-label={model.name + ": " + (cost === null ? "cost unavailable" : formatUsd(cost) + " per assumed task")}><div className={index === 0 ? "bar-fill highlighted" : "bar-fill"} style={{ width: cost === null ? 0 : Math.max(cost === 0 ? 0 : 1, cost / maxCost * 100) + "%" }} /></div><span className="bar-note">{model.setting.label} · {priceIsStale(model) ? "Historical rate · needs review" : "Rate checked " + displayDate(model.price.verifiedAt)}</span></div>) : <p className="chart-empty">Select a model to calculate its cost.</p>}</div>
          <div className="chart-caption"><Info size={16} aria-hidden="true" /><p>Thinking effort can change how many output tokens a model uses. Equal token assumptions don’t establish that two settings are equally efficient.</p></div>
        </section>
      </div>
      <section className="comparison-table-section"><div className="section-heading"><div><h2>The rates behind the estimate</h2><p>USD per million tokens. Standard API rates, within the documented pricing tier.</p></div></div><div className="table-scroll"><table><caption className="sr-only">Provider rates used in the cost calculator</caption><thead><tr><th scope="col">Model</th><th scope="col">Input</th><th scope="col">Cached input</th><th scope="col">Output</th><th scope="col">Source</th></tr></thead><tbody>{selectedModels.map(model => <tr key={model.id}><th scope="row"><Link href={"/models/" + model.id}>{model.name}</Link><small>{model.provider}</small></th><td>{model.price.input === null ? "Unknown" : formatUsd(model.price.input)}</td><td>{model.price.cachedInput === null ? "Unknown" : formatUsd(model.price.cachedInput)}</td><td>{model.price.output === null ? "Unknown" : formatUsd(model.price.output)}</td><td><a href={model.price.sourceUrl} target="_blank" rel="noreferrer">Provider <ArrowUpRight size={13} /></a></td></tr>)}</tbody></table></div>
        <div className="pricing-notes">{selectedModels.map(model => <p key={model.id}><strong>{model.name} · {model.setting.label}</strong> {model.price.note}</p>)}</div>
      </section>
    </> : <section className="quality-section">
      {suites.length ? <><div className="suite-label"><label htmlFor="benchmark-suite">Benchmark and version</label><Dropdown id="benchmark-suite" label="Benchmark and version" value={suite} onChange={setSuite} options={suites.map(name => ({ value: name, label: name }))} /></div><BenchmarkPlot points={plot} models={models} /><div className="table-scroll"><table><caption>Comparable results from the selected benchmark</caption><thead><tr><th>Model and setting</th><th>Score</th><th>USD / task</th><th>Sample</th><th>Source</th></tr></thead><tbody>{plot.map(point => { const model = models.find(model => model.id === point.variantId); return <tr key={point.id}><th scope="row">{model?.name} · {model?.setting.label}</th><td>{point.score} {point.unit}</td><td>{formatUsd(point.costUsd)}</td><td>{point.sampleSize}</td><td><a href={point.sourceUrl} target="_blank" rel="noreferrer">{displayDate(point.testedAt)} <ArrowUpRight size={12} /></a></td></tr>; })}</tbody></table></div></> : <div className="quality-explainer"><span className="eyebrow">Evidence before a leaderboard</span><h2>A score needs context.<br />So does a price.</h2><p>A cost-versus-quality plot needs a measured cost and score from the same evaluation. The cost calculator estimates cost for your chosen token budget.</p><div className="quality-requirements"><div><span>01</span><strong>The same task</strong><p>A named benchmark, version, and measured outcome.</p></div><div><span>02</span><strong>The exact setup</strong><p>Model, provider, thinking settings, and run conditions.</p></div><div><span>03</span><strong>The complete cost</strong><p>Billable reasoning, retries, and the price at test time.</p></div></div><a className="button button-dark" href="https://artificialanalysis.ai" target="_blank" rel="noreferrer">Explore Artificial Analysis <ArrowUpRight size={16} /></a></div>}
    </section>}
    <div className="comparison-bottom"><div><h3>Just need a good starting point?</h3><p>Tell us the task. We’ll keep the choices manageable.</p></div><Link className="text-button" href="/tasks">Find a model <ArrowRight size={17} /></Link></div>
  </>;
}

function BenchmarkPlot({ points, models }: { points: BenchmarkPoint[]; models: ModelVariant[] }) {
  const maxX = Math.max(...points.map(point => point.costUsd), 0.01) * 1.15;
  const minY = Math.min(0, ...points.map(point => point.score));
  const maxY = Math.max(...points.map(point => point.score), 1) * 1.1;
  return <div className="scatter-panel"><h2>{points[0]?.suite} · {points[0]?.version}</h2><p className="small">Exact settings are separate points. {points[0]?.higherIsBetter ? "Higher" : "Lower"} scores are better.</p><svg viewBox="0 0 760 370" role="img" aria-label="Measured task cost versus benchmark score. The same values are available in the table below.">
    {[0, 1, 2, 3, 4].map(index => <g key={index}><line x1="90" x2="700" y1={290 - index * 55} y2={290 - index * 55} stroke="var(--line)" /><text x="76" y={295 - index * 55} textAnchor="end" className="axis-label">{(minY + (maxY - minY) * index / 4).toFixed(1)}</text><text x={90 + index * 152.5} y="315" textAnchor="middle" className="axis-label">{formatUsd(maxX * index / 4)}</text></g>)}
    <text x="395" y="354" textAnchor="middle" className="axis-label">Measured cost (USD / task)</text><text transform="rotate(-90)" x="-180" y="22" textAnchor="middle" className="axis-label">Score ({points[0]?.unit})</text>
    {points.map((point, index) => { const model = models.find(model => model.id === point.variantId); const x = 90 + point.costUsd / maxX * 610; const y = 290 - (point.score - minY) / (maxY - minY) * 220; return <g key={point.id}><circle cx={x} cy={y} r="7" fill={index === 0 ? "var(--accent)" : "var(--ink)"}><title>{model?.name} · {model?.setting.label}: {point.score} {point.unit}, {formatUsd(point.costUsd)}</title></circle><text x={x + 12} y={y - 12} className="point-label">{model?.name}</text></g>; })}
  </svg></div>;
}
