"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { Dropdown } from "./dropdown";
import { scoreRange } from "@/lib/chart-range";
import { groupModelFamilies } from "@/lib/model-families";
import { estimateCost, formatUsd, priceIsStale } from "@/lib/cost";
import type { BenchmarkMetricId, ModelVariant } from "@/lib/types";

const metrics = [
  { value: "coding", label: "Coding · FrontierCode-AA 2.0" },
  { value: "agentic", label: "Agentic work · AutomationBench-AA" },
  { value: "instructionFollowing", label: "Instruction following · GDP.pdf" },
  { value: "intelligence", label: "Overall intelligence · Intelligence Index" },
] as const;

const providerColors: Record<string, string> = {
  OpenAI: "#176b5c",
  Anthropic: "#a8492d",
  Google: "#345aa6",
};


export function BenchmarkChart({ models, inputTokens, outputTokens, cachedTokens, validInputs, editWorkload }: { models: ModelVariant[]; inputTokens: number; outputTokens: number; cachedTokens: number; validInputs: boolean; editWorkload: () => void }) {
  const [metric, setMetric] = useState<BenchmarkMetricId>("coding");
  const [version, setVersion] = useState("Artificial Analysis Intelligence Index v5.0.2");
  const [active, setActive] = useState<string | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const [plotSize, setPlotSize] = useState({ width: 0, height: 0 });
  const plotWidth = plotSize.width;
  const families = groupModelFamilies(models).filter(family => family.deployment === "hosted" && family.availability === "available" && family.benchmarkProfile);
  const versions = [...new Set(families.flatMap(family => family.benchmarkProfile?.metrics.intelligence?.benchmark ?? []))];
  const candidates = families.flatMap(family => {
    const profile = family.benchmarkProfile;
    const score = profile?.metrics[metric];
    const model = family.variants.find(variant => variant.price.input !== null && variant.price.output !== null);
    if (!profile || !score || !model || (metric === "intelligence" && score.benchmark !== version)) return [];
    const cost = validInputs ? estimateCost(model, { inputTokens, outputTokens, cachedTokens }) : null;
    return cost === null ? [] : [{ family, model, profile, score, cost }];
  }).sort((a, b) => a.cost - b.cost || b.score.score - a.score.score || a.family.name.localeCompare(b.family.name));
  const points = candidates.map((point, index) => ({ ...point, number: index + 1, value: point.score.score, color: providerColors[point.family.developer] ?? "#5c6070" }));
  useEffect(() => {
    const element = plotRef.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => setPlotSize({ width: entries[0].contentRect.width, height: entries[0].contentRect.height }));
    observer.observe(element);
    return () => observer.disconnect();
  }, [validInputs, points.length === 0]);
  const selected = points.find(point => point.family.id === active);
  const maxX = Math.max(...families.flatMap(family => family.variants.map(model => validInputs ? estimateCost(model, { inputTokens, outputTokens, cachedTokens }) ?? 0 : 0)), 0.001);
  const stepMagnitude = 10 ** Math.floor(Math.log10(maxX / 4));
  const roughStep = maxX / 4 / stepMagnitude;
  const step = (roughStep <= 1 ? 1 : roughStep <= 2 ? 2 : roughStep <= 5 ? 5 : 10) * stepMagnitude;
  const xMax = Math.ceil(maxX / step) * step;
  const ticks = Array.from({ length: Math.round(xMax / step) + 1 }, (_, i) => i * step);
  const yRange = scoreRange(points.map(point => point.value));
  const labelPositions = new Map<string, { x: number; y: number; anchor: "start" | "end" }>();
  const occupied: { left: number; right: number; top: number; bottom: number }[] = [];
  const plotHeight = plotSize.height || 340;
  const estimatedPoints = points.map(point => ({ point, x: 34 + point.cost / xMax * Math.max(plotWidth - 58, 1), y: 18 + (yRange.max - point.value) / (yRange.max - yRange.min) * (plotHeight - 52) }));
  for (const { point, x, y } of estimatedPoints) {
    const width = Math.min(point.family.name.length * 6.4, 150);
    const options = [
      { dx: 16, dy: -13, anchor: "start" as const }, { dx: 16, dy: 17, anchor: "start" as const },
      { dx: -16, dy: -13, anchor: "end" as const }, { dx: -16, dy: 17, anchor: "end" as const },
      ...[31, -27, 45, -41, 59, -55].flatMap(dy => [{ dx: 16, dy, anchor: "start" as const }, { dx: -16, dy, anchor: "end" as const }]),
    ];
    const ranked = options.map(option => {
      const left = x + option.dx - (option.anchor === "end" ? width : 0);
      const box = { left, right: left + width, top: y + option.dy - 11, bottom: y + option.dy + 3 };
      const outside = Math.max(0, 30 - box.left) + Math.max(0, box.right - plotWidth + 4) + Math.max(0, 4 - box.top) + Math.max(0, box.bottom - plotHeight + 32);
      const collisions = occupied.filter(other => box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top).length;
      const markers = estimatedPoints.filter(other => other.point !== point && other.x + 12 > box.left && other.x - 12 < box.right && other.y + 12 > box.top && other.y - 12 < box.bottom).length;
      return { option, box, penalty: outside * 10 + collisions * 1000 + markers * 500 + Math.abs(option.dy) };
    }).sort((a, b) => a.penalty - b.penalty);
    occupied.push(ranked[0].box);
    labelPositions.set(point.family.id, { x: ranked[0].option.dx, y: ranked[0].option.dy, anchor: ranked[0].option.anchor });
  }
  const providers = [...new Set(points.map(point => point.family.developer))];

  return <section className="quality-section benchmark-section">
    <div className="section-heading"><div><h2>Benchmark performance and cost</h2><p>See how models compare on a shared sample task.</p></div></div>
    <div className="benchmark-controls">
      <div className="suite-label"><label htmlFor="benchmark-metric">Benchmark</label><Dropdown id="benchmark-metric" label="Benchmark" value={metric} onChange={value => { setMetric(value as BenchmarkMetricId); setActive(null); }} options={metrics.map(item => ({ ...item }))} /></div>
      {metric === "intelligence" && versions.length > 1 ? <div className="suite-label"><label htmlFor="benchmark-version">Index version</label><Dropdown id="benchmark-version" label="Index version" value={version} onChange={setVersion} options={versions.map(value => ({ value, label: value }))} /></div> : null}
      <div className="benchmark-workload"><span>Sample task</span><strong>{inputTokens.toLocaleString()} input · {outputTokens.toLocaleString()} output</strong><button className="text-button" onClick={editWorkload}>Edit token assumptions</button></div>
    </div>
    <p className="benchmark-context">{cachedTokens.toLocaleString()} cached input tokens included. Actual costs vary with each model’s output and reasoning.</p>
    {!validInputs ? <p role="status">Enter valid token counts in the cost calculator.</p> : points.length === 0 ? <p role="status">No matching benchmark scores and prices are available.</p> : <div className="benchmark-card">
      <div className="benchmark-card-header"><div><h3>Performance vs. cost</h3><p>Higher score and lower cost is better · score axis adjusts to the data</p></div><div className="benchmark-provider-legend" aria-label="Model providers">{providers.map(provider => <span key={provider}><i style={{ background: providerColors[provider] ?? "#5c6070" }} />{provider}</span>)}</div></div>
      <div className="benchmark-layout"><div className="benchmark-plot"><div className="benchmark-axis-title">Benchmark score {metric === "intelligence" ? "(index)" : "(%)"}</div>
        <div className="benchmark-chart-area" ref={plotRef}><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 18, right: 24, bottom: 4, left: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="#e8e8e5" />
          <XAxis type="number" dataKey="cost" domain={[0, xMax]} ticks={ticks} tickFormatter={formatUsd} tickLine={false} axisLine={{ stroke: "#d9d9d5" }} tick={{ fill: "#666b72", fontSize: 12 }} minTickGap={20} />
          <YAxis type="number" dataKey="value" domain={[yRange.min, yRange.max]} ticks={yRange.ticks} tickLine={false} axisLine={false} width={34} tick={{ fill: "#666b72", fontSize: 12 }} />
          <Tooltip cursor={{ stroke: "#b8bbb9", strokeDasharray: "3 4" }} content={({ active: visible, payload }) => { const point = payload?.[0]?.payload as typeof points[number] | undefined; return visible && point ? <div className="benchmark-tooltip"><strong>{point.family.name}</strong><span>{point.profile.effort} · {point.score.score}{point.score.unit === "%" ? "%" : " index"}</span><span>{formatUsd(point.cost)} per sample task</span></div> : null; }} />
          <Scatter data={[...points].sort((a, b) => Number(a.family.id === active) - Number(b.family.id === active))} isAnimationActive={false} shape={(props: unknown) => { const shape = props as { cx?: number; cy?: number; payload?: typeof points[number] }; const point = shape.payload; if (!point || shape.cx === undefined || shape.cy === undefined) return <g />; const selectedPoint = point.family.id === active; const label = labelPositions.get(point.family.id); return <g onMouseEnter={() => setActive(point.family.id)} onClick={() => setActive(point.family.id)}><circle cx={shape.cx} cy={shape.cy} r={selectedPoint ? 13 : 11} fill={point.color} stroke="white" strokeWidth={selectedPoint ? 3 : 2} /><text x={shape.cx} y={shape.cy} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="9" fontWeight="700" pointerEvents="none">{point.number}</text>{label && (plotWidth >= 500 || selectedPoint) ? <text x={shape.cx + label.x} y={shape.cy + label.y} textAnchor={label.anchor} className="benchmark-point-label" pointerEvents="none">{point.family.name}</text> : null}</g>; }} />
        </ScatterChart></ResponsiveContainer></div><div className="benchmark-x-title">Estimated API cost <span>USD / sample task</span></div></div>
        <div className="benchmark-models"><div className="benchmark-models-heading"><strong>Models</strong><span>{points.length} shown</span></div><div className="benchmark-model-list">{points.map(point => <button key={point.family.id} type="button" className="benchmark-model-row" aria-pressed={point.family.id === active} onClick={() => setActive(point.family.id)} onMouseEnter={() => setActive(point.family.id)} onFocus={() => setActive(point.family.id)}><span className="benchmark-number" style={{ background: point.color }}>{point.number}</span><span className="benchmark-model-name">{point.family.name}<small>{point.profile.effort} · {formatUsd(point.cost)}</small></span><strong>{point.value}{point.score.unit === "%" ? "%" : ""}</strong></button>)}</div></div>
      </div><div className="benchmark-card-footer" aria-live="polite">{selected ? <><strong>{selected.family.name}</strong><span>{selected.profile.effort} · {selected.score.score} {selected.score.unit} · {formatUsd(selected.cost)} per sample task</span></> : <span>Select a model to highlight it on the chart.</span>}</div>
    </div>}
    <div className="table-scroll"><table><caption>Benchmark scores and estimated sample costs</caption><thead><tr><th>Model and effort</th><th>Score</th><th>Estimated cost</th><th>Sources</th></tr></thead><tbody>{points.map(point => <tr key={point.family.id}><th scope="row"><Link href={`/models/${point.model.id}`}>{point.family.name}</Link><small>{point.model.provider} · {point.profile.effort}</small></th><td>{point.score.score} {point.score.unit}</td><td>{formatUsd(point.cost)}{priceIsStale(point.model) ? <small>Historical rate · needs review</small> : null}</td><td><a href={point.score.sourceUrl ?? point.profile.sourceUrl}>Benchmark</a> · <a href={point.model.price.sourceUrl}>Price</a></td></tr>)}</tbody></table></div>
  </section>;
}
