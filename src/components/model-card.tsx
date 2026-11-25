import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ChevronDown } from "lucide-react";
import type { Recommendation } from "@/lib/types";
import { tierLabels, displayDate } from "@/lib/categories";
import { formatUsd, priceIsStale } from "@/lib/cost";
import { CopySettings } from "./copy-settings";

export function ModelCard({ result }: { result: Recommendation }) {
  const { model, guidance, recommended, category } = result;
  const relevant = model.observations?.filter(note => category && note.tasks.includes(category)) ?? [];
  const observation = relevant.find(note => note.url === guidance.evidenceUrl) ?? relevant[0];
  return <article className={recommended ? "model-card recommended" : "model-card"}>
    <div className="card-topline"><span>{tierLabels[model.tier]}</span>{recommended ? <span className="recommended-label"><Check size={13} aria-hidden="true" />Start here</span> : null}</div>
    <div className="model-heading"><div className="provider-mark" aria-hidden="true">{model.developer.charAt(0)}</div><span className="provider-name">{model.provider}</span></div>
    <h3><Link href={"/models/" + model.id}>{model.name}</Link></h3>
    <p className="model-setting">{model.setting.label}<span>·</span>{model.deployment === "local" ? "Local" : model.image ? "Hosted" : "Hosted API"}</p>
    <p className="model-fit">{guidance.bestFor}</p>
    <div className="example"><span>For example</span><p>{guidance.example}</p></div>
    <p className="step-up"><ArrowUpRight size={16} aria-hidden="true" /><span>{guidance.stepUp}</span></p>
    <details className="model-evidence"><summary>Why this choice? <ChevronDown size={14} aria-hidden="true" /></summary><div>
      {observation && <div>
        <p>{observation.summary}</p>
        <p className="small">{observation.scope}</p>
        <p className="small"><a href={observation.url} target="_blank" rel="noreferrer">{observation.label} <ArrowUpRight size={12} aria-hidden="true" /></a> · {observation.kind} · Checked {displayDate(observation.checkedAt)}</p>
      </div>}
      <p>{guidance.limitation}</p>
      <p className="small">Editorial task guidance. Reviewed {displayDate(model.reviewedAt)}.</p>
      <ul>{model.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label} <ArrowUpRight size={12} aria-hidden="true" /></a></li>)}</ul>
    </div></details>
    <div className="card-price">{model.image ? <>
      <strong>{model.image.outputUsd === null ? model.image.priceBasis : formatUsd(model.image.outputUsd) + " " + model.image.priceBasis}</strong>
      <span>{priceIsStale(model) ? "Pricing needs review · " : ""}{model.price.note}</span>
    </> : model.price.input !== null && model.price.output !== null ? <><strong>${model.price.input} in / ${model.price.output} out</strong><span>per 1M tokens{priceIsStale(model) ? " · price needs review" : ""}</span></> : <><strong>Infrastructure cost varies</strong><span>No measured local cost yet</span></>}</div>
    <div className="card-actions">
      {model.image ? model.toolUrl ? (
        <a href={model.toolUrl} target="_blank" rel="noreferrer" className="text-button">Open tool <ArrowUpRight size={15} aria-hidden="true" /></a>
      ) : null : <CopySettings model={model} />}
      <Link href={"/models/" + model.id} className="text-button">{model.image ? "Setup & brief" : "Details"} <ArrowRight size={15} aria-hidden="true" /></Link>
    </div>
  </article>;
}
