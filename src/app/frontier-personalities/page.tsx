import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { frontierPersonalities, geminiPersonalityReviewDate, personalityReviewDate, type PersonalityObservation } from "@/content/frontier-personalities";
import { displayDate } from "@/lib/categories";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Frontier Personalities",
  description: "How the latest Claude, GPT and Gemini models approach work, with firsthand tests and community reports.",
};

export default function FrontierPersonalitiesPage() {
  return (
    <div className={`content-width page-content ${styles.page}`}>
      <header className="page-heading">
        <h1>Frontier Personalities</h1>
        <p>How Claude, GPT and Gemini models approach a brief, take initiative, and respond when the work gets messy.</p>
        <p className={styles.evidenceNote}>Pricing tiers compare standard API token rates across these nine models: lower cost up to $2 input per million tokens, mid cost $3–$4, and higher cost $8. Temporary promotions are excluded; actual spend depends on usage. See <a href="https://platform.claude.com/docs/en/models/overview">Anthropic</a>, <a href="https://developers.openai.com/api/docs/pricing">OpenAI</a>, and <a href="https://ai.google.dev/gemini-api/docs/pricing">Google</a> pricing.</p>
        <p className={styles.evidenceNote}>
          These profiles draw on hands-on reviews, community reports, and provider examples.
          Behavior varies with the task, app, and reasoning effort; community reports are individual experiences.
          Claude and GPT sources checked <time dateTime={personalityReviewDate}>{displayDate(personalityReviewDate)}</time>;{" "}
          Gemini sources checked <time dateTime={geminiPersonalityReviewDate}>{displayDate(geminiPersonalityReviewDate)}</time>.
        </p>
      </header>

      {frontierPersonalities.map(group => (
        <section key={group.id} className={styles.group} aria-labelledby={`${group.id}-profiles`}>
          <h2 id={`${group.id}-profiles`}>{group.name}</h2>
          <div className={styles.grid}>
            {group.profiles.map(profile => (
              <article key={profile.name} className={styles.card}>
                <header>
                  <h3>{profile.name}</h3>
                  <p className={styles.pricingTier}>{profile.pricingTier}</p>
                  <p className={styles.traits}>{profile.traits}</p>
                </header>
                <BehaviorNote title="How it works" observation={profile.style} />
                <BehaviorNote title="Where it can stumble" observation={profile.tradeoff} />
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function BehaviorNote({ title, observation }: { title: string; observation: PersonalityObservation }) {
  return (
    <div className={styles.note}>
      <h4>{title}</h4>
      <p>{observation.text}</p>
      <ul className={styles.sources} aria-label={`Sources for ${title.toLowerCase()}`}>
        {observation.sources.map(source => (
          <li key={source.url}>
            <a href={source.url}>
              {source.label} <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
