import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ModelCatalogTable, type ModelCatalogRow } from "@/components/model-catalog-table";
import { readCatalog } from "@/lib/repository";
import { formatUsd, priceIsStale } from "@/lib/cost";
import { groupModelFamilies } from "@/lib/model-families";
import type { ModelVariant } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Model catalog" };

export default async function ModelsPage() {
  const { bundle, warning } = await readCatalog();
  const families = groupModelFamilies(bundle.models);
  const images = bundle.models.filter(model => model.image);
  const rows: ModelCatalogRow[] = families.map(family => ({
    id: family.id,
    name: family.name,
    developer: family.developer,
    provider: family.provider,
    variants: family.variants.map(model => model.setting.label),
    codingDefault: family.codingDefault,
    benchmarkProfile: family.benchmarkProfile,
  }));

  return (
    <div className="content-width page-content model-directory">
      {warning ? <p className="catalog-warning" role="status">{warning}</p> : null}
      <header className="page-heading model-catalog-intro">
        <span className="eyebrow"><span className="accent-line" />Model catalog</span>
        <h1>Compare the model, then choose the effort</h1>
        <p>Start with one row per model family. Open a model to see how it behaves, which reasoning levels are available, and when the extra effort is worth it.</p>
        <div className="page-heading-links">
          <Link className="text-button" href="/models/explore">Browse the wider model directory <ArrowRight size={16} aria-hidden="true" /></Link>
          <Link className="text-button" href="/compare">Compare cost and measured quality <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </header>
      {rows.length ? <ModelCatalogTable rows={rows} /> : <p>No model settings have been published yet.</p>}
      <ModelDirectorySection title="Image models and tools" models={images} now={new Date()} />
    </div>
  );
}

function ModelDirectorySection({ title, models, now }: { title: string; models: ModelVariant[]; now: Date }) {
  if (!models.length) return null;
  return (
    <section className="directory-section image-directory" aria-label={title}>
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>Creative tools use workflow and output settings instead of reasoning effort.</p>
        </div>
      </div>
      <ul className="directory-list">
        {models.map(model => (
          <li key={model.id}>
            <Link href={`/models/${model.id}`} className="directory-row">
              <span className="directory-model"><strong>{model.name}</strong><small>{model.provider}</small></span>
              <span>{model.setting.label}</span>
              <span className="directory-rate">
                {model.availability === "setup-required" ? "Setup required" : model.availability === "unavailable" ? "Unavailable" : model.image ? (
                  <>{model.image.outputUsd === null ? model.image.priceBasis : `${formatUsd(model.image.outputUsd)} ${model.image.priceBasis}`}{priceIsStale(model, now) ? <small>Pricing needs review</small> : null}</>
                ) : null}
              </span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
