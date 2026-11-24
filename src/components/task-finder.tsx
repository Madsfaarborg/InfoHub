"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, SlidersHorizontal, LockKeyhole, ArrowUpRight } from "lucide-react";
import { categories } from "@/lib/categories";
import { interpretTask, recommend } from "@/lib/recommend";
import type { CategoryId, ModelVariant, Priority, TaskInterpretation } from "@/lib/types";
import { CategoryIcon } from "./category-icon";
import { ModelCard } from "./model-card";

export function TaskFinder({ models, initialCategory }: { models: ModelVariant[]; initialCategory?: CategoryId }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [category, setCategory] = useState<CategoryId | null>(initialCategory || null);
  const [interpretation, setInterpretation] = useState<TaskInterpretation>({ category: initialCategory || null, alternatives: [], complexity: "routine", localOnly: false });
  const [priority, setPriority] = useState<Priority>("value");
  const [localOnly, setLocalOnly] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
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
  const results = category ? recommend(models, category, { priority, localOnly, complexity: interpretation.complexity }) : [];
  function choose(id: CategoryId) {
    setCategory(id);
    setSubmitted(true);
    setInterpretation(current => ({ ...current, category: id, alternatives: [] }));
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    const next = interpretTask(query);
    setInterpretation(next);
    setCategory(next.category);
    setLocalOnly(next.localOnly);
    setSubmitted(true);
  }
  const showResults = submitted || !!initialCategory;
  return <>
    <section className={showResults ? "hero hero-compact" : "hero"} aria-labelledby="hero-title">
      <h1 id="hero-title">Choose the right model<br /> for the job</h1>
      <p className="hero-description">Practical guidance for choosing a model, setting its thinking level,<br className="desktop-break" /> and knowing when it’s worth spending more.</p>
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
    {showResults ? <section className="results-section content-width" ref={resultsRef} aria-labelledby="results-heading">
      <div className="section-heading"><div><h2 id="results-heading">{selected ? selected.name : "Choose a task category"}</h2><p>{selected ? selected.description : "Pick the category that best describes your task."}</p></div><span className="small muted" aria-live="polite">{selected ? results.length + (results.length === 1 ? " suggestion" : " suggestions") : ""}</span></div>
      {category ? <>
        <div className="result-controls">
          <div className="control-group"><SlidersHorizontal size={16} aria-hidden="true" /><label htmlFor="priority">Prioritize</label><select id="priority" value={priority} onChange={event => setPriority(event.target.value as Priority)}><option value="value">Good value</option><option value="quality">Thoroughness</option><option value="speed">A quick starting point</option></select></div>
          <div className="control-group"><label htmlFor="complexity">Task scope</label><select id="complexity" value={interpretation.complexity} onChange={event => setInterpretation(current => ({ ...current, complexity: event.target.value as "routine" | "complex" }))}><option value="routine">Well-defined</option><option value="complex">Complex / uncertain</option></select></div>
          <label className="toggle-label"><input type="checkbox" checked={localOnly} onChange={event => setLocalOnly(event.target.checked)} /><span className="toggle-track" aria-hidden="true" />Local models only</label>
        </div>
        {interpretation.alternatives.length ? <div className="interpretation-note">Another possible fit: {interpretation.alternatives.filter(id => id !== category).map(id => <button className="inline-button" key={id} onClick={() => choose(id)}>{categories.find(item => item.id === id)?.name}</button>)}</div> : null}
        {results.length ? <><div className="model-grid">{results.map(result => <ModelCard key={result.model.id} result={result} />)}</div><p className="results-footnote">A curated starting point, not a benchmark ranking. API access and company approval are separate. Prices are provider rates; actual spend depends on tokens, thinking, and retries.</p></> :
          <div className="empty-panel"><div className="empty-icon"><LockKeyhole size={23} strokeWidth={1.5} /></div><h3>{localOnly ? "Your local model needs a home first." : "No published match for these constraints."}</h3><p>{localOnly ? "The Qwen options below need a configured local deployment. We won’t replace your local-only choice with a cloud model." : "Try a different task category, or adjust your preferences."}</p><div className="local-options">{models.filter(model => model.deployment === "local" && model.guidance[category]).map(model => <Link key={model.id} href={"/models/" + model.id}>{model.name} · {model.setting.label}<ArrowUpRight size={14} /></Link>)}</div></div>}
      </> : <div className="category-picker">{(interpretation.alternatives.length ? categories.filter(item => interpretation.alternatives.includes(item.id)) : categories).map(item => <button key={item.id} onClick={() => choose(item.id)}><CategoryIcon category={item.id} /><span><strong>{item.name}</strong><span>{item.description}</span></span><ArrowRight size={17} /></button>)}</div>}
      <p className="results-footnote"><Link className="text-button" href="/models">Browse all model settings <ArrowRight size={14} aria-hidden="true" /></Link></p>
    </section> : null}
  </>;
}
