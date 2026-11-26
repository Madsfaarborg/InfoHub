import { Dropdown } from "@/components/dropdown";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { aaFeedIds, aaFeeds, filterAaEntries, isAaFeed, type AaFeed } from "@/lib/aa-catalog";
import { displayDate } from "@/lib/categories";
import { readArtificialAnalysis } from "@/lib/repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Browse Artificial Analysis models" };

const directoryUrl = "/models/explore";
const pageSize = 30;
const sources = [
  ["Language models", aaFeeds.language.sourceUrl],
  ["Image generation", aaFeeds.image.sourceUrl],
  ["Image editing", aaFeeds["image-editing"].sourceUrl],
  ["Video models", "https://artificialanalysis.ai/video/models"],
  ["Video editing", "https://artificialanalysis.ai/video/leaderboard/video-editing/"],
  ["Speech models", "https://artificialanalysis.ai/text-to-speech/speech-explorer"],
  ["Music models", aaFeeds["vocal-music"].sourceUrl],
] as const;

function linkFor(page: number, query: string, feed: AaFeed | null) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (feed) params.set("feed", feed);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? directoryUrl + "?" + search : directoryUrl;
}

export default async function ExploreModels({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, { snapshot, unavailable }] = await Promise.all([searchParams, readArtificialAnalysis()]);
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";
  const feed = typeof params.feed === "string" && isAaFeed(params.feed) ? params.feed : null;
  const requestedPage = typeof params.page === "string" && /^\d{1,6}$/.test(params.page) ? Number(params.page) : 1;
  const matches = snapshot ? filterAaEntries(snapshot.entries, query, feed) : [];
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  const page = Math.max(1, Math.min(requestedPage, pages));
  const rows = matches.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="content-width page-content">
      <Link className="back-link" href="/models"><ArrowLeft size={16} aria-hidden="true" />Model catalog</Link>
      <header className="page-heading">
        <h1>Browse Artificial Analysis models</h1>
        <p>Look up model names, creators, and benchmark categories. For a quick decision, use the task finder’s three suggested choices.</p>
        <Link className="text-button" href="/tasks">Find a model for a task <ArrowRight size={16} aria-hidden="true" /></Link>
      </header>

      {snapshot ? (
        <section aria-labelledby="directory-heading">
          <div className="section-heading">
            <div>
              <h2 id="directory-heading">Imported model directory</h2>
              <p>{snapshot.entries.length.toLocaleString("en")} entries · Updated {displayDate(snapshot.refreshedAt)}</p>
            </div>
          </div>
          <form action={directoryUrl} method="get" className="directory-filters">
            <label>Model or creator<input name="q" type="search" defaultValue={query} maxLength={120} placeholder="Search models" /></label>
            <div className="directory-filter"><label htmlFor="directory-feed">Benchmark category</label><Dropdown id="directory-feed" name="feed" label="Benchmark category" defaultValue={feed ?? ""} options={[{ value: "", label: "All categories" }, ...aaFeedIds.map(id => ({ value: id, label: aaFeeds[id].label }))]} /></div>
            <button type="submit" className="button button-dark"><Search size={16} aria-hidden="true" />Search</button>
          </form>
          {rows.length ? (
            <>
              <p className="small muted directory-count">{matches.length.toLocaleString("en")} matching {matches.length === 1 ? "entry" : "entries"}</p>
              <div className="table-scroll">
                <table>
                  <caption className="sr-only">Artificial Analysis models, with names as published by the source</caption>
                  <thead><tr><th scope="col">Model or variant</th><th scope="col">Creator</th><th scope="col">Benchmark category</th></tr></thead>
                  <tbody>
                    {rows.map(entry => (
                      <tr key={entry.id}>
                        <th scope="row">{entry.name}</th>
                        <td>{entry.creator}</td>
                        <td>{entry.feeds.map(id => aaFeeds[id].label).join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pages > 1 ? (
                <nav className="directory-pages" aria-label="Model directory pages">
                  {page > 1 ? <Link className="text-button" href={linkFor(page - 1, query, feed)}><ArrowLeft size={15} aria-hidden="true" />Previous</Link> : <span />}
                  <span>Page {page} of {pages}</span>
                  {page < pages ? <Link className="text-button" href={linkFor(page + 1, query, feed)}>Next <ArrowRight size={15} aria-hidden="true" /></Link> : <span />}
                </nav>
              ) : null}
            </>
          ) : <p className="directory-count">No matches. Try another name or <Link className="inline-link" href={directoryUrl}>clear the filters</Link>.</p>}
          <p className="results-footnote">
            Source: <a className="inline-link" href="https://artificialanalysis.ai/" target="_blank" rel="noreferrer">Artificial Analysis</a>. Coverage reflects the documented API feeds. Some public leaderboards include additional models.
          </p>
        </section>
      ) : (
        <section aria-label="Directory status" className="directory-status">
          <h2>{unavailable ? "The imported directory couldn’t load" : "The imported directory isn’t connected yet"}</h2>
          <p>Browse the live Artificial Analysis directories below.</p>
        </section>
      )}

      <section className="directory-section directory-sources" aria-labelledby="source-heading">
        <h2 id="source-heading">Browse on Artificial Analysis</h2>
        <ul className="directory-list">
          {sources.map(([label, url]) => <li key={label}><a className="source-row" href={url} target="_blank" rel="noreferrer">{label}<ArrowUpRight size={17} aria-hidden="true" /></a></li>)}
        </ul>
      </section>
    </div>
  );
}
