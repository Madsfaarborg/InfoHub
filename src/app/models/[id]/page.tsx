import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Info } from "lucide-react";
import { CopySettings } from "@/components/copy-settings";
import { ReportedBenchmarks } from "@/components/reported-benchmarks";
import { readCatalog } from "@/lib/repository";
import { categories, displayDate, imageWorkflows, tierLabels } from "@/lib/categories";
import { formatUsd, priceIsStale } from "@/lib/cost";
import type { TaskGuidance } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { bundle, warning } = await readCatalog();
  const model = bundle.models.find(item => item.id === id);
  if (!model) notFound();

  const image = model.image;
  const useCases = image
    ? imageWorkflows.map(workflow => ({ name: workflow.name, href: "/tasks/images", guidance: image.workflows[workflow.id] }))
    : categories.map(category => ({ name: category.name, href: "/tasks/" + category.id, guidance: model.guidance[category.id] }));

  return (
    <div className="content-width page-content model-detail">
      {warning ? <p className="catalog-warning" role="status">{warning}</p> : null}
      <Link className="back-link" href={image ? "/tasks/images" : "/tasks"}>
        <ArrowLeft size={16} aria-hidden="true" />{image ? "Find an image model" : "Find a model"}
      </Link>
      <header className="page-heading">
        <span className="eyebrow">{model.provider} · {tierLabels[model.tier]}</span>
        <h1>{model.name}</h1>
        <p>{model.description}</p>
        <div className="detail-heading-actions">
          <span className="setting-pill">{model.setting.label}</span>
          <span className="small muted">{model.deployment === "local" ? "Local deployment" : image ? "Hosted image tool" : "Hosted API"} · Reviewed {displayDate(model.reviewedAt)}</span>
        </div>
      </header>
      {model.availability !== "available" ? (
        <div className="setup-notice">
          <Info size={20} aria-hidden="true" />
          <div>
            <strong>{model.availability === "setup-required" ? "Local setup required" : "Currently unavailable"}</strong>
            <p>{model.availability === "setup-required" ? "Configure and evaluate this deployment before use." : "This configuration is retained for reference."}</p>
          </div>
        </div>
      ) : null}
      <div className="detail-layout">
        <section>
          {model.observations?.length ? (
            <section className="behavior-notes" aria-labelledby="behavior-title">
              <h2 id="behavior-title">How it works in practice</h2>
              {model.observations.map(note => (
                <article key={note.url + note.summary}>
                  <span className="small muted">{note.kind} · Checked {displayDate(note.checkedAt)}</span>
                  <p>{note.summary}</p>
                  <p className="small">{note.scope}</p>
                  <a className="text-button" href={note.url} target="_blank" rel="noreferrer">{note.label} <ArrowUpRight size={14} aria-hidden="true" /></a>
                </article>
              ))}
            </section>
          ) : null}
          {useCases.some(item => item.guidance) && <h2>A practical fit for</h2>}
          <div className="use-cases">
            {useCases.map(({ name, href, guidance }) => guidance ? <UseCase key={name} name={name} href={href} guidance={guidance} /> : null)}
          </div>
          {image ? (
            <section className="image-brief">
              <h2>Example image brief</h2>
              <p>{image.brief}</p>
            </section>
          ) : null}
        </section>
        <aside className="model-setup">
          <h2>{image ? "Suggested setup" : "The exact setup"}</h2>
          <dl>
            <dt>Model identifier</dt>
            <dd className="mono model-id">{model.modelId}</dd>
            {model.limits ? (
              <>
                <div><dt>Context window</dt><dd>{model.limits.contextTokens.toLocaleString("en")} tokens</dd></div>
                <div><dt>Maximum output</dt><dd>{model.limits.maxOutputTokens.toLocaleString("en")} tokens</dd></div>
              </>
            ) : null}
            {Object.entries(model.setting.parameters).map(([key, value]) => (
              <div key={key}><dt>{key}</dt><dd className="mono">{String(value)}</dd></div>
            ))}
          </dl>
          <p className="small">{model.setting.note}</p>
          <CopySettings model={model} />
          {model.toolUrl ? <a className="button button-dark" href={model.toolUrl} target="_blank" rel="noreferrer">Open provider <ArrowUpRight size={16} aria-hidden="true" /></a> : null}
          <div className="settings-divider" />
          <h3>Provider pricing</h3>
          {image ? (
            <p className="image-pricing">{image.outputUsd === null ? image.priceBasis : formatUsd(image.outputUsd) + " " + image.priceBasis}</p>
          ) : (
            <>
              <div className="price-pair"><span>Input / 1M tokens</span><strong>{model.price.input === null ? "Unknown" : formatUsd(model.price.input)}</strong></div>
              <div className="price-pair"><span>Output / 1M tokens</span><strong>{model.price.output === null ? "Unknown" : formatUsd(model.price.output)}</strong></div>
              {model.price.cachedInput !== null ? <div className="price-pair"><span>Cache reads / 1M tokens</span><strong>{formatUsd(model.price.cachedInput)}</strong></div> : null}
            </>
          )}
          <p className="small">{model.price.note}</p>
          <p className="small muted"><a href={model.price.sourceUrl} target="_blank" rel="noreferrer">Checked {displayDate(model.price.verifiedAt)} <ArrowUpRight size={12} aria-hidden="true" /></a>{priceIsStale(model) ? " · Needs review" : ""}</p>
        </aside>
      </div>
      <ReportedBenchmarks models={[model]} />
      <section className="sources-section">
        <div>
          <h2>Sources and scope</h2>
          <p>Provider documentation supports the settings and prices. The task examples are editorial starting points for your team to evaluate.</p>
        </div>
        <ul>
          {model.sources.map(source => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer">{source.label}<ArrowUpRight size={16} aria-hidden="true" /></a>
              <span>{source.kind === "provider" ? "Provider documentation" : source.kind === "benchmark" ? "Benchmark" : "Editorial"} · Checked {displayDate(source.checkedAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function UseCase({ name, href, guidance }: { name: string; href: string; guidance: TaskGuidance }) {
  return (
    <article>
      <Link href={href}>{name}<ArrowUpRight size={15} aria-hidden="true" /></Link>
      <h3>{guidance.bestFor}</h3>
      <p>{guidance.example}</p>
      <p className="use-case-caveat">{guidance.limitation}</p>
      <p className="small">{guidance.stepUp}</p>
    </article>
  );
}
