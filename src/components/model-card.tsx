import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ChevronDown } from "lucide-react";
import type { Recommendation } from "@/lib/types";
import { tierLabels, displayDate } from "@/lib/categories";
import { priceIsStale } from "@/lib/cost";
import { CopySettings } from "./copy-settings";

export function ModelCard({ result }: { result: Recommendation }) {
  const { model, guidance, recommended } = result;
  return <article className={recommended ? "model-card recommended" : "model-card"}>
    <div className="card-topline"><span>{tierLabels[model.tier]}</span>{recommended ? <span className="recommended-label"><Check size={13} aria-hidden="true" />Start here</span> : null}</div>
    <div className="model-heading"><div className="provider-mark" aria-hidden="true">{model.developer === "OpenAI" ? "O" : model.developer === "Anthropic" ? "A" : "Q"}</div><span className="provider-name">{model.provider}</span></div>
    <h3><Link href={"/models/" + model.id}>{model.name}</Link></h3>
    <p className="model-setting">{model.setting.label}<span>·</span>{model.deployment === "local" ? "Local" : "Hosted API"}</p>
    <p className="model-fit">{guidance.bestFor}</p>
    <div className="example"><span>For example</span><p>{guidance.example}</p></div>
    <p className="step-up"><ArrowUpRight size={16} aria-hidden="true" /><span>{guidance.stepUp}</span></p>
    <details className="model-evidence"><summary>Why this choice? <ChevronDown size={14} aria-hidden="true" /></summary><div>
      <p>{guidance.limitation}</p>
      <p className="small">Task fit is editorial guidance, not a measured ranking. Reviewed {displayDate(model.reviewedAt)}.</p>
      <ul>{model.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label} <ArrowUpRight size={12} aria-hidden="true" /></a></li>)}</ul>
    </div></details>
    <div className="card-price">{model.price.input !== null && model.price.output !== null ? <><strong>${model.price.input} in / ${model.price.output} out</strong><span>per 1M tokens{priceIsStale(model) ? " · price needs review" : ""}</span></> : <><strong>Infrastructure cost varies</strong><span>No measured local cost yet</span></>}</div>
    <div className="card-actions"><CopySettings model={model} /><Link href={"/models/" + model.id} className="text-button">Details <ArrowRight size={15} aria-hidden="true" /></Link></div>
  </article>;
}
