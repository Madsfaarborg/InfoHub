"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, SlidersHorizontal, LockKeyhole, ArrowUpRight } from "lucide-react";
import { categories, imageWorkflows } from "@/lib/categories";
import { guidanceFor, interpretImageWorkflow, interpretTask, recommend } from "@/lib/recommend";
import type { CategoryId, ImageWorkflow, ModelVariant, Priority, TaskInterpretation } from "@/lib/types";
import { CategoryIcon } from "./category-icon";
import { ModelCard } from "./model-card";

const priorityLabels: Record<Priority, string> = {
  value: "Good value",
  quality: "Thoroughness",
  speed: "A quick starting point",
};

export function TaskFinder({ models, initialCategory }: { models: ModelVariant[]; initialCategory?: CategoryId }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [category, setCategory] = useState<CategoryId | null>(initialCategory || null);
  const [interpretation, setInterpretation] = useState<TaskInterpretation>({ category: initialCategory || null, alternatives: [], complexity: "routine", localOnly: false });
  const [priority, setPriority] = useState<Priority>("value");
  const [localOnly, setLocalOnly] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey && !target.closest("input, textarea, select, [contenteditable]")) {
        event.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);
  const selected = categories.find(item => item.id === category);
  const imageWorkflow = interpretation.imageWorkflow ?? "concepts";
  const isImage = category === "images";
  const results = category ? recommend(models, category, { priority, localOnly, complexity: interpretation.complexity, imageWorkflow }) : [];
  const localSetups = category ? models.filter(model => model.deployment === "local" && model.availability === "setup-required" && guidanceFor(model, category, imageWorkflow)) : [];
  function choose(id: CategoryId) {
    setCategory(id);
    setSubmitted(true);
    setInterpretation(current => ({
      ...current, category: id, alternatives: [],
      imageWorkflow: id === "images" ? interpretImageWorkflow(query) : undefined,
    }));
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    const next = interpretTask(query);
    setInterpretation(next);
    setCategory(next.category);
    setLocalOnly(next.localOnly);
    setPriority(next.priority ?? (interpretation.priority ? "value" : priority));
    setSubmitted(true);
  }
  const showResults = submitted || !!initialCategory;
  return <>
    <section className={showResults ? "hero hero-compact" : "hero"} aria-labelledby="hero-title">
      <h1 id="hero-title">Choose the right model<br /> for the job</h1>
      <p className="hero-description">Find AI tools for images, campaigns, slides, spreadsheets, and technical work. See which settings to start with and what they cost.</p>
      <form className="search-form" onSubmit={submit} role="search">
        <Search size={21} strokeWidth={1.6} aria-hidden="true" />
        <label htmlFor="task-search" className="sr-only">What do you need to get done?</label>
        <input ref={input} id="task-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="What do you need to get done?" autoComplete="off" maxLength={2000} />
        <kbd className="search-shortcut">/</kbd>
        <button type="submit" className="search-submit" aria-label="Find a model" disabled={!query.trim()}><ArrowRight size={20} aria-hidden="true" /></button>
      </form>
      <p className="search-help"><LockKeyhole size={12} aria-hidden="true" />Your task stays in this browser</p>
      <div className="task-shortcuts" aria-label="Choose a task">{categories.map(item => <button key={item.id} onClick={() => choose(item.id)} aria-pressed={category === item.id} className={category === item.id ? "task-chip selected" : "task-chip"}><CategoryIcon category={item.id} size={16} />{item.name}</button>)}</div>
    </section>
    {showResults ? <section className="results-section content-width" aria-labelledby="results-heading">
      <div className="section-heading"><div><h2 id="results-heading">{selected ? selected.name : interpretation.alternatives.length ? "Which part should the model help with?" : "Choose a task category"}</h2><p>{selected ? selected.description : interpretation.alternatives.length ? "Choose the main goal to see model recommendations." : "Pick the category that best describes your task."}</p></div><span className="small muted" aria-live="polite">{selected ? results.length + (results.length === 1 ? " suggestion" : " suggestions") : ""}</span></div>
      {category ? <>
        <div className="result-controls" aria-label="Adjust task interpretation" role="group">
          <div className="control-group"><label htmlFor="task-category">Task</label><select id="task-category" value={category} onChange={event => choose(event.target.value as CategoryId)}>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          {isImage ? (
            <div className="control-group">
              <SlidersHorizontal size={16} aria-hidden="true" />
              <label htmlFor="image-workflow">Image task</label>
              <select id="image-workflow" value={imageWorkflow} onChange={event => setInterpretation(current => ({ ...current, imageWorkflow: event.target.value as ImageWorkflow }))}>
                {imageWorkflows.map(workflow => <option key={workflow.id} value={workflow.id}>{workflow.name}</option>)}
              </select>
            </div>
          ) : <>
            <div className="control-group"><SlidersHorizontal size={16} aria-hidden="true" /><label htmlFor="priority">Prioritize</label><select id="priority" value={priority} onChange={event => {
              setPriority(event.target.value as Priority);
              setInterpretation(current => ({ ...current, priority: undefined }));
            }}>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div className="control-group"><label htmlFor="complexity">Task scope</label><select id="complexity" value={interpretation.complexity} onChange={event => setInterpretation(current => ({ ...current, complexity: event.target.value as "routine" | "complex" }))}><option value="routine">Well-defined</option><option value="complex">Complex / uncertain</option></select></div>
          </>}
          <label className="toggle-label"><input type="checkbox" checked={localOnly} onChange={event => setLocalOnly(event.target.checked)} /><span className="toggle-track" aria-hidden="true" />Local models only</label>
        </div>
        {interpretation.alternatives.length ? <div className="interpretation-note">Another possible fit: {interpretation.alternatives.filter(id => id !== category).map(id => <button className="inline-button" key={id} onClick={() => choose(id)}>{categories.find(item => item.id === id)?.name}</button>)}</div> : null}
        {results.length ? <>
          <div className="model-grid">{results.map(result => <ModelCard
            key={result.model.id}
            result={result}
            deeperOption={!isImage && !result.recommended && result.model.tier === "deep" && results[0].model.tier !== "deep"}
          />)}</div>
          <p className="results-footnote">{isImage ? "These are editorial picks for this workflow. API image rates, subscription credits, and local hardware costs have different billing bases." : "Recommendations are editorial. API access and company approval are separate. Actual spend depends on tokens, thinking, and retries."}</p>
        </> : <div className="empty-panel">
          <div className="empty-icon"><LockKeyhole size={23} strokeWidth={1.5} aria-hidden="true" /></div>
          <h3>{localOnly ? "No ready-to-use local match" : "No published match for these constraints"}</h3>
          <p>{localSetups.length && localOnly ? "These local options require setup before your team can use them." : localOnly ? "Try another task or keep the local-only filter in place until a suitable model is available." : "Try a different task category or adjust your preferences."}</p>
          {localOnly && localSetups.length ? <div className="local-options">{localSetups.map(model => <Link key={model.id} href={"/models/" + model.id}>{model.name} · {model.setting.label}<ArrowUpRight size={14} aria-hidden="true" /></Link>)}</div> : null}
        </div>}
        {isImage ? <p className="results-footnote">Use approved reference assets and check product details, spelling, and brand colors before publishing.</p> : null}
      </> : <div className="category-picker">{(interpretation.alternatives.length ? categories.filter(item => interpretation.alternatives.includes(item.id)) : categories).map(item => <button key={item.id} onClick={() => choose(item.id)}><CategoryIcon category={item.id} /><span><strong>{item.name}</strong><span>{item.description}</span></span><ArrowRight size={17} /></button>)}</div>}
      <p className="results-footnote"><Link className="text-button" href="/models">Browse curated model settings <ArrowRight size={14} aria-hidden="true" /></Link></p>
    </section> : null}
  </>;
}
