"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, SlidersHorizontal, LockKeyhole, ArrowUpRight } from "lucide-react";
import { categories, imageWorkflows } from "@/lib/categories";
import { guidanceFor, interpretImageWorkflow, interpretTask, recommend } from "@/lib/recommend";
import type { CategoryId, ImageWorkflow, ModelVariant, Priority, TaskInterpretation } from "@/lib/types";
import { CategoryIcon } from "./category-icon";
import { ModelCard } from "./model-card";
import { useFirstResult, useReveal } from "./motion";
import { Dropdown } from "./dropdown";

const priorityLabels: Record<Priority, string> = {
  value: "Good value",
  quality: "Thoroughness",
  speed: "A quick starting point",
};

export function TaskFinder({ models, initialCategory, home = false }: { models: ModelVariant[]; initialCategory?: CategoryId; home?: boolean }) {
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
      if (!event.defaultPrevented && event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey && !target.closest("input, textarea, select, [contenteditable]")) {
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
  const showResults = submitted || !!initialCategory;
  const example = recommend(models, "coding", { priority: "value", localOnly: false, complexity: "routine", imageWorkflow: "concepts" })[0];
  const { hero, capture } = useFirstResult(showResults);
  const resultMotion = useReveal<HTMLElement>([showResults, category, priority, localOnly, interpretation.complexity, imageWorkflow]);
  function choose(id: CategoryId) {
    capture();
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
    capture();
    const next = interpretTask(query);
    setInterpretation(next);
    setCategory(next.category);
    setLocalOnly(next.localOnly);
    setPriority(next.priority ?? (interpretation.priority ? "value" : priority));
    setSubmitted(true);
  }
  return <>
    <section ref={hero} className={showResults ? "hero hero-compact" : home ? "hero hero-home" : "hero"} aria-labelledby="hero-title">
      <div className="hero-main">
      <h1 id="hero-title">{showResults ? "Find a model" : <>Choose the right model<br /> for the job</>}</h1>
      <p className="hero-description">Find AI tools for images, campaigns, slides, spreadsheets, and technical work. See which settings to start with and what they cost.</p>
      <form className="search-form" onSubmit={submit} role="search">
        <Search size={21} strokeWidth={1.6} aria-hidden="true" />
        <label htmlFor="task-search" className="sr-only">What do you need to get done?</label>
        <input ref={input} id="task-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="What do you need to get done?" autoComplete="off" maxLength={2000} />
        <kbd className="search-shortcut">/</kbd>
        <button type="submit" className="search-submit" aria-label="Find a model" disabled={!query.trim()}><ArrowRight size={20} aria-hidden="true" /></button>
      </form>
      <p className="search-help"><LockKeyhole size={12} aria-hidden="true" />Your task stays in this browser</p>
      </div>
      {home && !showResults && example ? <aside className="hero-example" aria-label="Example recommendation"><p className="example-label">Example task</p><h2>Write a small Python script</h2><div className="example-recommendation"><span>Suggested starting point · {example.model.setting.label}</span><strong>{example.model.name}</strong><p>{example.guidance.bestFor}</p><span>{example.model.provider}</span></div><button type="button" onClick={() => { setQuery("Write a small Python script"); choose("coding"); }}>Try this task <ArrowRight size={17} aria-hidden="true" /></button></aside> : null}
      <div className="task-shortcuts" aria-label="Choose a task">{categories.map(item => <button key={item.id} onClick={() => choose(item.id)} aria-pressed={category === item.id} className={category === item.id ? "task-chip selected" : "task-chip"}><CategoryIcon category={item.id} size={16} />{item.name}</button>)}</div>
    </section>
    {showResults ? <section ref={resultMotion} className="results-section content-width" aria-labelledby="results-heading">
      <div className="section-heading"><div><h2 id="results-heading">{selected ? selected.name : interpretation.alternatives.length ? "Which part should the model help with?" : "Choose a task category"}</h2><p>{selected ? selected.description : interpretation.alternatives.length ? "Choose the main goal to see model recommendations." : "Pick the category that best describes your task."}</p></div><span className="small muted" aria-live="polite">{selected ? results.length + (results.length === 1 ? " suggestion" : " suggestions") : ""}</span></div>
      {category ? <>
        <details className="refinement-panel"><summary>Refine your results{localOnly ? " · Local models only" : ""}</summary><div className="result-controls" aria-label="Adjust task interpretation" role="group">
          <div className="control-group">
            <label htmlFor="task-category">Task</label>
            <Dropdown id="task-category" label="Task" value={category}
              onChange={value => choose(value as CategoryId)}
              options={categories.map(item => ({ value: item.id, label: item.name }))} />
          </div>
          {isImage ? (
            <div className="control-group">
              <SlidersHorizontal size={16} aria-hidden="true" />
              <label htmlFor="image-workflow">Image task</label>
              <Dropdown id="image-workflow" label="Image task" value={imageWorkflow} onChange={value => setInterpretation(current => ({ ...current, imageWorkflow: value as ImageWorkflow }))} options={imageWorkflows.map(workflow => ({ value: workflow.id, label: workflow.name }))} />
            </div>
          ) : <>
            <div className="control-group">
              <SlidersHorizontal size={16} aria-hidden="true" />
              <label htmlFor="priority">Prioritize</label>
              <Dropdown id="priority" label="Prioritize" value={priority} onChange={value => {
                setPriority(value as Priority);
                setInterpretation(current => ({ ...current, priority: undefined }));
              }} options={Object.entries(priorityLabels).map(([value, label]) => ({ value, label }))} />
            </div>
            <div className="control-group"><label htmlFor="complexity">Task scope</label><Dropdown id="complexity" label="Task scope" value={interpretation.complexity} onChange={value => setInterpretation(current => ({ ...current, complexity: value as "routine" | "complex" }))} options={[{ value: "routine", label: "Well-defined" }, { value: "complex", label: "Complex / uncertain" }]} /></div>
          </>}
          <label className="toggle-label"><input type="checkbox" checked={localOnly} onChange={event => setLocalOnly(event.target.checked)} /><span className="toggle-track" aria-hidden="true" />Local models only</label>
        </div></details>
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

