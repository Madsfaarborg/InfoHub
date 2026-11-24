import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Info } from "lucide-react";
import { CopySettings } from "@/components/copy-settings";
import { readCatalog } from "@/lib/repository";
import { categories, displayDate, tierLabels } from "@/lib/categories";
import { formatUsd } from "@/lib/cost";

export const dynamic = "force-dynamic";
export default async function ModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { bundle, warning } = await readCatalog();
  const model = bundle.models.find(item => item.id === id);
  if (!model) notFound();
  return <div className="content-width page-content model-detail">{warning ? <p className="catalog-warning" role="status">{warning}</p> : null}<Link className="back-link" href="/tasks"><ArrowLeft size={16} />Find a model</Link><header className="page-heading"><span className="eyebrow">{model.provider} · {tierLabels[model.tier]}</span><h1>{model.name}</h1><p>{model.description}</p><div className="detail-heading-actions"><span className="setting-pill">{model.setting.label}</span><span className="small muted">{model.deployment === "local" ? "Local deployment" : "Hosted API"} · Reviewed {displayDate(model.reviewedAt)}</span></div></header>
    {model.availability !== "available" ? <div className="setup-notice"><Info size={20} /><div><strong>{model.availability === "setup-required" ? "Local setup required" : "Currently unavailable"}</strong><p>This option is not offered as a ready-to-use recommendation. Configure and evaluate the exact deployment before making it available to colleagues.</p></div></div> : null}
    <div className="detail-layout"><section><h2>A practical fit for</h2><div className="use-cases">{categories.map(category => { const guidance = model.guidance[category.id]; return guidance ? <article key={category.id}><Link href={"/tasks/" + category.id}>{category.name}<ArrowUpRight size={15} /></Link><h3>{guidance.bestFor}</h3><p>{guidance.example}</p><p className="use-case-caveat">{guidance.limitation}</p><p className="small"><strong>Step up when:</strong> {guidance.stepUp}</p></article> : null; })}</div></section>
      <aside className="model-setup"><h2>The exact setup</h2><p className="small">Provider-specific controls. They are not interchangeable across models.</p><dl><dt>Model identifier</dt><dd className="mono model-id">{model.modelId}</dd>{Object.entries(model.setting.parameters).map(([key, value]) => <div key={key}><dt>{key}</dt><dd className="mono">{String(value)}</dd></div>)}</dl><p className="small">{model.setting.note}</p><CopySettings model={model} />{model.toolUrl ? <a className="button button-dark" href={model.toolUrl} target="_blank" rel="noreferrer">Open provider <ArrowUpRight size={16} /></a> : null}<div className="settings-divider" /><h3>Provider pricing</h3><div className="price-pair"><span>Input / 1M tokens</span><strong>{model.price.input === null ? "Unknown" : formatUsd(model.price.input)}</strong></div><div className="price-pair"><span>Output / 1M tokens</span><strong>{model.price.output === null ? "Unknown" : formatUsd(model.price.output)}</strong></div><p className="small">{model.price.note}</p><p className="small muted">Checked {displayDate(model.price.verifiedAt)}</p></aside></div>
    <section className="sources-section"><div><span className="eyebrow">Trace the reasoning</span><h2>Sources and scope</h2><p>Capabilities and prices come from provider documentation. Task-fit guidance is editorial and should be validated against your team’s work.</p></div><ul>{model.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}<ArrowUpRight size={16} /></a><span>{source.kind === "provider" ? "Provider documentation" : source.kind === "benchmark" ? "Benchmark" : "Editorial"} · Checked {displayDate(source.checkedAt)}</span></li>)}</ul></section>
  </div>;
}
