import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { readCatalog } from "@/lib/repository";
import { formatUsd, priceIsStale } from "@/lib/cost";
import type { ModelVariant } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Model catalog" };

export default async function ModelsPage() {
  const { bundle, warning } = await readCatalog();
  const hosted = bundle.models.filter(model => !model.image && model.deployment === "hosted");
  const local = bundle.models.filter(model => !model.image && model.deployment === "local");
  const images = bundle.models.filter(model => model.image);
  const now = new Date();
  return (
    <div className="content-width page-content model-directory">
      {warning ? <p className="catalog-warning" role="status">{warning}</p> : null}
      <header className="page-heading">
        <h1>Model catalog</h1>
        <p>Browse image tools, language models, and the settings and rates behind each recommendation.</p>
      </header>
      {!bundle.models.length ? <p>No model settings have been published yet.</p> : null}
      <ModelDirectorySection title="Image models and tools" models={images} now={now} />
      <ModelDirectorySection title="Hosted language models" models={hosted} now={now} />
      <ModelDirectorySection title="Local language models" models={local} now={now} />
    </div>
  );
}

function ModelDirectorySection({ title, models, now }: { title: string; models: ModelVariant[]; now: Date }) {
  if (!models.length) return null;
  return (
    <section className="directory-section" aria-label={title}>
      <h2>{title}</h2>
      <ul className="directory-list">
        {models.map(model => (
          <li key={model.id}>
            <Link href={"/models/" + model.id} className="directory-row">
              <span className="directory-model"><strong>{model.name}</strong><small>{model.provider}</small></span>
              <span>{model.setting.label}</span>
              <span className="directory-rate">
                {model.availability === "setup-required" ? "Setup required" : model.availability === "unavailable" ? "Unavailable" : model.image ? (
                  <>{model.image.outputUsd === null ? model.image.priceBasis : formatUsd(model.image.outputUsd) + " " + model.image.priceBasis}{priceIsStale(model, now) ? <small>Pricing needs review</small> : null}</>
                ) : model.price.input === null || model.price.output === null ? "Cost unavailable" : (
                  <>{formatUsd(model.price.input)} in / {formatUsd(model.price.output)} out<small>USD per 1M tokens{priceIsStale(model, now) ? " · Needs review" : ""}</small></>
                )}
              </span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
