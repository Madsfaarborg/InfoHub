import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Info } from "lucide-react";
import { CopySettings } from "@/components/copy-settings";
import { ReportedBenchmarks } from "@/components/reported-benchmarks";
import { readCatalog } from "@/lib/repository";
import { displayDate, imageWorkflows, tierLabels } from "@/lib/categories";
import { formatUsd, priceIsStale } from "@/lib/cost";
import { benchmarkValue, findModelFamily, primaryGuidance, type ModelFamily } from "@/lib/model-families";
import type { BenchmarkMetricId, EvidenceSource, ModelVariant, TaskGuidance } from "@/lib/types";

export const dynamic = "force-dynamic";

const benchmarkLabels: { id: BenchmarkMetricId; label: string }[] = [
  { id: "coding", label: "Coding" },
  { id: "agentic", label: "Agentic" },
  { id: "instructionFollowing", label: "Instructions" },
  { id: "intelligence", label: "Intelligence" },
];

export default async function ModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { bundle, warning } = await readCatalog();
  const selected = bundle.models.find(item => item.id === id);
  if (!selected) notFound();
  if (selected.image) return <ImageModelPage model={selected} warning={warning} />;
  const family = findModelFamily(bundle.models, id);
  if (!family) notFound();
  return <LanguageModelPage family={family} warning={warning} />;
}

function LanguageModelPage({ family, warning }: { family: ModelFamily; warning: string | null }) {
  const contextWindow = Math.max(...family.variants.map(model => model.limits?.contextTokens ?? 0));
  const sourceMap = new Map<string, EvidenceSource>();
  family.variants.flatMap(model => model.sources).forEach(source => sourceMap.set(source.url, source));
  const sources = [...sourceMap.values()];
  const profile = family.benchmarkProfile;

  return (
    <div className="content-width page-content model-detail model-family-detail">
      {warning ? <p className="catalog-warning" role="status">{warning}</p> : null}
      <Link className="back-link" href="/models"><ArrowLeft size={16} aria-hidden="true" />All models</Link>
      <header className="page-heading model-family-heading">
        <span className="eyebrow">{family.developer} · {family.provider}</span>
        <h1>{family.name}</h1>
        <p>{family.description}</p>
        <div className="detail-heading-actions">
          <span className="setting-pill">{family.variants.length} {family.variants.length === 1 ? "configuration" : "configurations"}</span>
          {family.codingDefault ? <span className="small muted">Coding default: {family.codingDefault}</span> : null}
        </div>
      </header>

      {profile ? <BenchmarkStrip family={family} /> : null}

      <div className="model-family-layout">
        <div className="model-family-primary">
          <section className="model-personality" aria-labelledby="personality-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Sourced behavior</span>
                <h2 id="personality-title">Working personality</h2>
                <p>How reviewers describe the model in practice, with the scope of each observation kept visible.</p>
              </div>
            </div>
            {family.observations.length ? (
              <div className="personality-list">
                {family.observations.map(note => (
                  <article key={note.url + note.summary}>
                    <div className="personality-meta">
                      <span>{note.kind}</span>
                      <span>Checked {displayDate(note.checkedAt)}</span>
                    </div>
                    <h3>{note.summary}</h3>
                    <p>{note.scope}</p>
                    <a className="text-button" href={note.url} target="_blank" rel="noreferrer">{note.label} <ArrowUpRight size={14} aria-hidden="true" /></a>
                  </article>
                ))}
              </div>
            ) : <p className="empty-evidence">No sourced behavior notes have been published for this model yet.</p>}
          </section>

          <section className="effort-guide" aria-labelledby="effort-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Configuration guide</span>
                <h2 id="effort-title">Choose the reasoning effort</h2>
                <p>Start with the smallest configuration that fits the task, then step up when the failure mode justifies it.</p>
              </div>
            </div>
            <div className="effort-list">
              {family.variants.map(model => <EffortCard key={model.id} model={model} codingDefault={family.codingDefault} />)}
            </div>
          </section>
        </div>

        <aside className="family-facts">
          <h2>At a glance</h2>
          <dl>
            <div><dt>Developer</dt><dd>{family.developer}</dd></div>
            <div><dt>Access</dt><dd>{family.deployment === "local" ? "Local deployment" : family.provider}</dd></div>
            <div><dt>Coding default</dt><dd>{family.codingDefault ?? "Not curated"}</dd></div>
            {contextWindow ? <div><dt>Context window</dt><dd>{contextWindow.toLocaleString("en")} tokens</dd></div> : null}
            <div><dt>Availability</dt><dd>{family.availability === "available" ? "Available" : family.availability === "setup-required" ? "Setup required" : "Reference only"}</dd></div>
          </dl>
          {profile ? (
            <div className="fact-source">
              <h3>Benchmark profile</h3>
              <p>{profile.effort}. Results are kept at their original units and are not blended.</p>
              <a className="text-button" href={profile.sourceUrl} target="_blank" rel="noreferrer">{profile.sourceLabel} <ArrowUpRight size={14} aria-hidden="true" /></a>
              <span className="small muted">Checked {displayDate(profile.checkedAt)}</span>
            </div>
          ) : null}
        </aside>
      </div>

      <ReportedBenchmarks models={family.variants} />
      <SourcesSection sources={sources} />
    </div>
  );
}

function BenchmarkStrip({ family }: { family: ModelFamily }) {
  const profile = family.benchmarkProfile;
  if (!profile) return null;
  return (
    <section className="model-benchmark-strip" aria-labelledby="benchmark-strip-title">
      <div className="benchmark-strip-intro">
        <span className="eyebrow">Independent results</span>
        <h2 id="benchmark-strip-title">{profile.effort} effort</h2>
      </div>
      <div className="benchmark-strip-values">
        {benchmarkLabels.map(({ id, label }) => {
          const result = benchmarkValue(profile, id);
          return (
            <div key={id}>
              <span>{label}</span>
              <strong>{result ? `${result.score.toLocaleString("en", { maximumFractionDigits: 1 })}${result.unit === "%" ? "%" : ""}` : "—"}</strong>
              <small>{result?.benchmark ?? "Not reported"}</small>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EffortCard({ model, codingDefault }: { model: ModelVariant; codingDefault: string | null }) {
  const fit = primaryGuidance(model);
  const isCodingDefault = codingDefault && model.setting.label.toLocaleLowerCase("en").startsWith(codingDefault.toLocaleLowerCase("en"));
  return (
    <article className="effort-card">
      <header>
        <div>
          <span className="eyebrow">{tierLabels[model.tier]}</span>
          <h3>{model.setting.label}</h3>
        </div>
        {isCodingDefault ? <span className="effort-recommendation">Coding default</span> : null}
      </header>
      {model.availability !== "available" ? (
        <div className="effort-availability"><Info size={16} aria-hidden="true" />{model.availability === "setup-required" ? "Configure and evaluate this deployment before use" : "Retained for reference"}</div>
      ) : null}
      {fit ? (
        <div className="effort-guidance">
          <span className="effort-category">Use for {fit.category}</span>
          <h4>{fit.guidance.bestFor}</h4>
          <p>{fit.guidance.example}</p>
          <dl>
            <div><dt>Watch for</dt><dd>{fit.guidance.limitation}</dd></div>
            <div><dt>Step up when</dt><dd>{fit.guidance.stepUp}</dd></div>
          </dl>
        </div>
      ) : <p className="empty-evidence">This earlier configuration is retained for behavior and pricing reference.</p>}
      <div className="effort-setup">
        {model.benchmarkProfile && model.benchmarkProfile.effort !== "High" ? (
          <div><span>{model.benchmarkProfile.effort} benchmark results</span>
            {Object.values(model.benchmarkProfile.metrics).map(result => <p key={result.benchmark}>{result.benchmark}: {result.score}{result.unit === "%" ? "%" : ""}</p>)}
            <a href={model.benchmarkProfile.sourceUrl}>{model.benchmarkProfile.sourceLabel}</a>
          </div>
        ) : null}
        <div>
          <span>Model identifier</span>
          <code>{model.modelId}</code>
        </div>
        <div>
          <span>Input / output per 1M tokens</span>
          <strong>{model.price.input === null || model.price.output === null ? "Cost unavailable" : `${formatUsd(model.price.input)} / ${formatUsd(model.price.output)}`}</strong>
        </div>
        <CopySettings model={model} />
      </div>
    </article>
  );
}

function ImageModelPage({ model, warning }: { model: ModelVariant; warning: string | null }) {
  const image = model.image;
  if (!image) notFound();
  const useCases = imageWorkflows.map(workflow => ({ name: workflow.name, href: "/tasks/images", guidance: image.workflows[workflow.id] }));
  return (
    <div className="content-width page-content model-detail">
      {warning ? <p className="catalog-warning" role="status">{warning}</p> : null}
      <Link className="back-link" href="/models"><ArrowLeft size={16} aria-hidden="true" />All models</Link>
      <header className="page-heading">
        <span className="eyebrow">{model.provider} · {tierLabels[model.tier]}</span>
        <h1>{model.name}</h1>
        <p>{model.description}</p>
        <div className="detail-heading-actions">
          <span className="setting-pill">{model.setting.label}</span>
          <span className="small muted">Hosted image tool · Reviewed {displayDate(model.reviewedAt)}</span>
        </div>
      </header>
      <div className="detail-layout">
        <section>
          <h2>A practical fit for</h2>
          <div className="use-cases">
            {useCases.map(({ name, href, guidance }) => guidance ? <UseCase key={name} name={name} href={href} guidance={guidance} /> : null)}
          </div>
          <section className="image-brief"><h2>Example image brief</h2><p>{image.brief}</p></section>
        </section>
        <aside className="model-setup">
          <h2>Suggested setup</h2>
          <dl>
            <dt>Model identifier</dt><dd className="mono model-id">{model.modelId}</dd>
            {Object.entries(model.setting.parameters).map(([key, value]) => <div key={key}><dt>{key}</dt><dd className="mono">{String(value)}</dd></div>)}
          </dl>
          <p className="small">{model.setting.note}</p>
          <CopySettings model={model} />
          {model.toolUrl ? <a className="button button-dark" href={model.toolUrl} target="_blank" rel="noreferrer">Open provider <ArrowUpRight size={16} aria-hidden="true" /></a> : null}
          <div className="settings-divider" />
          <h3>Provider pricing</h3>
          <p className="image-pricing">{image.outputUsd === null ? image.priceBasis : `${formatUsd(image.outputUsd)} ${image.priceBasis}`}</p>
          <p className="small">{model.price.note}</p>
          <p className="small muted"><a href={model.price.sourceUrl} target="_blank" rel="noreferrer">Checked {displayDate(model.price.verifiedAt)} <ArrowUpRight size={12} aria-hidden="true" /></a>{priceIsStale(model) ? " · Needs review" : ""}</p>
        </aside>
      </div>
      <SourcesSection sources={model.sources} />
    </div>
  );
}

function SourcesSection({ sources }: { sources: EvidenceSource[] }) {
  return (
    <section className="sources-section">
      <div>
        <h2>Sources and scope</h2>
        <p>Provider facts, independent results, and editorial guidance stay visibly separate so a benchmark does not masquerade as a recommendation.</p>
      </div>
      <ul>
        {sources.map(source => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">{source.label}<ArrowUpRight size={16} aria-hidden="true" /></a>
            <span>{source.kind === "provider" ? "Provider documentation" : source.kind === "benchmark" ? "Benchmark" : "Editorial"} · Checked {displayDate(source.checkedAt)}</span>
          </li>
        ))}
      </ul>
    </section>
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
