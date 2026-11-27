type Source = {
  label: string;
  url: `https://${string}`;
};

export type PersonalityObservation = {
  text: string;
  sources: Source[];
};

type Profile = {
  name: string;
  pricingTier: "Lower cost" | "Mid cost" | "Higher cost";
  traits: string;
  style: PersonalityObservation;
  tradeoff: PersonalityObservation;
};

const gpt62Launch: Source = {
  label: "OpenAI launch",
  url: "https://openai.com/index/introducing-gpt-6-2-astra-sol/",
};

export const personalityReviewDate = "2026-11-25";
export const geminiPersonalityReviewDate = "2026-11-27";

export const frontierPersonalities: { id: string; name: string; profiles: Profile[] }[] = [
  {
    id: "claude",
    name: "Claude",
    profiles: [
      {
        name: "Claude Fable 5.2",
        pricingTier: "Higher cost",
        traits: "Inventive, self-directed, ambitious",
        style: {
          text: "Give Fable an outcome and it can invent much of the route. Claire Vo’s tests went from a brand brief to an animated video and from a typewriter idea to an interactive writing room. Matt Shumer found a single Fable agent took more ownership of his game build than his initial multi-agent setup.",
          sources: [
            { label: "How I AI hands-on tests", url: "https://www.chatprd.ai/how-i-ai/fable-5-2-review-creative-enough-to-build-a-typewriter-still-bad-at-web-design" },
            { label: "Matt Shumer’s build diary", url: "https://somethingbig.ai/fable-5-2-review" },
          ],
        },
        tradeoff: {
          text: "That initiative can widen the job. One Claude Code user posted a retrospective describing unsolicited edits at high effort. A separate launch thread includes reports of Fable working through long task lists with little steering and of agent runs consuming a usage window before delivering a result.",
          sources: [
            { label: "r/claude scope report", url: "https://www.reddit.com/r/claude/comments/1xs3ppo/fable_52_retrospective_im_an_ai_coding_agent_in/" },
            { label: "r/claude launch discussion", url: "https://www.reddit.com/r/claude/comments/1xskbif/hows_everyone_finding_claude_fable_52_so_far/" },
          ],
        },
      },
      {
        name: "Claude Opus 5.5",
        pricingTier: "Mid cost",
        traits: "Persistent, consultative, thorough",
        style: {
          text: "Opus can stay with a task for hours and still invite input on the decisions that need it. CodeRabbit describes an overnight coding run that made substantial progress. A Claude Code user found that it surfaced what was missing from an architecture decision and asked for the rationale behind an edit before writing the handoff.",
          sources: [
            { label: "CodeRabbit’s hands-on review", url: "https://www.coderabbit.ai/blog/opus-5-5-model-review" },
            { label: "r/ClaudeCode collaboration report", url: "https://www.reddit.com/r/ClaudeCode/comments/1wo0h7d/opus_55_keeps_you_in_the_loop/" },
          ],
        },
        tradeoff: {
          text: "Opus can spend its time on supporting work. In Every’s week of testing, it built materials for a timed client-training exercise and ran out of time before making the schedule. The team found its conversations easier to follow than Opus 5’s, though finished prose still sometimes buried the main point.",
          sources: [
            { label: "Every’s week of testing", url: "https://every.to/vibe-check/vibe-check-opus-5-5-is-pulling-our-codex-converts-back-to-claude" },
          ],
        },
      },
      {
        name: "Claude Sonnet 5.5",
        pricingTier: "Lower cost",
        traits: "Iterative, responsive, comfortable with feedback",
        style: {
          text: "Sonnet fits work you can steer in short turns. Every’s team used it to brainstorm, try directions and polish results after feedback. In a Claude Code user’s 25-task comparison, Sonnet at high effort came close to Opus at medium after each implementation got one round of fixes.",
          sources: [
            { label: "Every’s workflow notes", url: "https://www.linkedin.com/posts/everyinc_turning-up-sonnet-55s-effort-setting-didn-activity-7510519254451052544-2AP0" },
            { label: "r/ClaudeCode implementation trial", url: "https://www.reddit.com/r/ClaudeCode/comments/1x7a5v9/opus_55_med_or_sonnet_55_high_implementer_part_2/" },
          ],
        },
        tradeoff: {
          text: "A quick back-and-forth can turn into a long build. In AI for Mortals’ build tests, Sonnet took over three times as long as Opus to rebuild the same 3D website. CodeRabbit also found that it missed more issues than Opus on its harder code reviews.",
          sources: [
            { label: "AI for Mortals’ build tests", url: "https://www.aiformortals.co/blog/sonnet-5-5" },
            { label: "CodeRabbit’s review tests", url: "https://www.coderabbit.ai/blog/sonnet-5-5-model-review" },
          ],
        },
      },
    ],
  },
  {
    id: "gpt",
    name: "GPT",
    profiles: [
      {
        name: "GPT-6.2 Astra",
        pricingTier: "Higher cost",
        traits: "Intensely focused, terse, sensitive to scope",
        style: {
          text: "Astra can lock onto one part of a problem. In Offloop’s testing it handled clearly specified coding tasks well, then sometimes stayed with one detail long enough to lose the thread of a bigger assignment. OpenAI’s launch examples show where that focus can pay off, including tracing figures through source documents and matching an existing slide template.",
          sources: [
            { label: "Offloop’s hands-on review", url: "https://offloop.org/learn/gpt-6-2-sol-and-astra-review" },
            gpt62Launch,
          ],
        },
        tradeoff: {
          text: "Astra’s focus can be narrow. One r/ChatGPT user found it stuck closely to the prompt and needed follow-ups for broader implications. A separate medium-effort codebase audit reportedly stopped at surface-level findings, and the early testers covered by MindStudio also described clipped explanations and unfinished builds.",
          sources: [
            { label: "r/ChatGPT scope discussion", url: "https://www.reddit.com/r/ChatGPT/comments/1y1snpm/astra_62_is_finally_a_real_option_for_plus_users/" },
            { label: "r/OpenAI audit report", url: "https://www.reddit.com/r/OpenAI/comments/1y4mjhd/astra_62_is_lazy/" },
            { label: "MindStudio’s early-review roundup", url: "https://www.mindstudio.ai/blog/gpt-6-2-astra-early-reviews" },
          ],
        },
      },
      {
        name: "GPT-6.2 Sol",
        pricingTier: "Lower cost",
        traits: "Quick to act, practical, occasionally inventive",
        style: {
          text: "Sol can get to a workable first pass quickly. Offloop’s tester found the usual coding answers familiar, with occasional solutions they hadn’t considered. A Codex user running several narrowly scoped sessions also reported fast completion and efficient token use.",
          sources: [
            { label: "Offloop’s first-pass coding tests", url: "https://offloop.org/learn/gpt-6-2-sol-and-astra-review" },
            { label: "r/codex workflow report", url: "https://www.reddit.com/r/codex/comments/1xz94st/i_been_using_62_sol_for_different_roles_with/" },
          ],
        },
        tradeoff: {
          text: "Steering it mid-task can take work. Offloop saw Sol stick with the same approach after a new instruction. A Codex issue describes sessions that ended at minor blockers, and launch-thread participants reported extra scaffolding in some coding runs.",
          sources: [
            { label: "Offloop’s follow-through notes", url: "https://offloop.org/learn/gpt-6-2-sol-and-astra-review" },
            { label: "Codex issue #62195", url: "https://github.com/openai/codex/issues/62195" },
            { label: "Hacker News launch discussion", url: "https://news.ycombinator.com/item?id=50535230" },
          ],
        },
      },
      {
        name: "GPT-6.1 Terra",
        pricingTier: "Lower cost",
        traits: "Fast, direct, comfortable with visual input",
        style: {
          text: "Terra moves quickly when it has something concrete to inspect. Dustin’s AI Lab found its answers direct and saw it handle focused screen-reading tasks and small patches with tests. OpenAI’s launch demos show it applying that visual work to forms and technical drawings.",
          sources: [
            { label: "Dustin’s AI Lab hands-on tests", url: "https://danyuchn.github.io/blog/posts/en/gpt-6-1-terra-review/" },
            { label: "OpenAI launch", url: "https://openai.com/index/introducing-gpt-6-1-terra/" },
          ],
        },
        tradeoff: {
          text: "Fine details can slip through. Terra repeatedly missed a single wrong Chinese character in Dustin’s navigation-label test and inverted controls in two of Remy’s 3D builds. In one forum user’s Blender test, max effort took 11 minutes on the same image-to-model brief that took 3 minutes at extra high.",
          sources: [
            { label: "Dustin’s AI Lab UI checks", url: "https://danyuchn.github.io/blog/posts/en/gpt-6-1-terra-review/" },
            { label: "Remy’s hands-on 3D tests", url: "https://goremy.ai/blog/articles/gpt-6-1-terra-hands-on-test-results" },
            { label: "r/OpenaiCodex Blender test", url: "https://www.reddit.com/r/OpenaiCodex/comments/1xgq7nk/gpt61_terra_3d_design_test/" },
          ],
        },
      },
    ],
  },

  {
    id: "gemini",
    name: "Gemini",
    profiles: [
      {
        name: "Gemini 4 Carbon",
        pricingTier: "Mid cost",
        traits: "Methodical, independent, sometimes slow",
        style: {
          text: "Carbon can work through a substantial brief on its own. In one developer’s small Go and HTMX pipeline trial, four separately specified phases passed on the first run, with few changes in a subsequent Opus audit. Every’s live testers also valued Carbon as a different-thinking second opinion and praised its multimodal work.",
          sources: [
            { label: "r/google_antigravity pipeline trial", url: "https://www.reddit.com/r/google_antigravity/comments/1xszqoj/my_preliminary_results_on_carbon/" },
            { label: "Every live test recap", url: "https://usefollowed.com/episodes/every-live-vibe-check-gemini-4-carbon" },
          ],
        },
        tradeoff: {
          text: "Depth can come at the expense of a finished answer. One developer reported that a large, high-effort API code review spent almost 45 minutes reasoning and returned no usable review. In Every’s live test, the team also found Carbon verbose and its default visual design cluttered.",
          sources: [
            { label: "r/GeminiFeedback API report", url: "https://www.reddit.com/r/GeminiFeedback/comments/1xtc2os/gemini_4_carbon_on_high_spent_45_minutes_and_262k/" },
            { label: "Every live test recap", url: "https://usefollowed.com/episodes/every-live-vibe-check-gemini-4-carbon" },
          ],
        },
      },
      {
        name: "Gemini 4 Neon",
        pricingTier: "Mid cost",
        traits: "Readable, analytical, attentive to detail",
        style: {
          text: "Neon can be an approachable collaborator that looks closely at the work. An Antigravity user described its responses as readable after two hours on a project. In an overnight Azure and .NET review, a developer found Neon caught real issues the other reviewer missed, including a sign-in failure and a sandbox bypass.",
          sources: [
            { label: "r/google_antigravity first impressions", url: "https://www.reddit.com/r/google_antigravity/comments/1xzx6cs/gemini_4_neon_is_actually_fucking_good/" },
            { label: "Huuhka’s code-review trial", url: "https://huuhka.net/testing-gemini-4-neon-as-a-code-reviewer/" },
          ],
        },
        tradeoff: {
          text: "Its confidence and attention to detail still need checking. In that same review trial, Neon approved three changes with serious issues caught by Sol and took longer per review. In one Gemini app writing discussion, a user found Neon less nuanced than Argon; others in a separate thread preferred Neon for reviews but disagreed about its implementation quality.",
          sources: [
            { label: "Huuhka’s code-review trial", url: "https://huuhka.net/testing-gemini-4-neon-as-a-code-reviewer/" },
            { label: "Google forum writing feedback", url: "https://discuss.ai.google.dev/t/missing-gemini-4-argon-in-the-gemini-app-please-dont-trade-depth-for-speed/202469" },
            { label: "r/GeminiAI comparison", url: "https://www.reddit.com/r/GeminiAI/comments/1y58ag6/gemini_4_neon_vs_claude_opus_55_how_do_they/" },
          ],
        },
      },
      {
        name: "Gemini 4 Hydrogen",
        pricingTier: "Lower cost",
        traits: "Quick, practical, responsive to a concrete brief",
        style: {
          text: "Hydrogen is built for quick execution, and early tests show it handling concrete briefs across formats. In a medium-thinking hands-on review it transcribed a short recording accurately and followed the requested format. In a developer’s Laravel feature trial, Hydrogen High matched 3.8 Flash High on the reported score in less time, though this was only one task.",
          sources: [
            { label: "SME-Insights hands-on tests", url: "https://www.sme-insights.co.uk/gemini-4-hydrogen-hands-on-review/" },
            { label: "r/GeminiAI Laravel trial", url: "https://www.reddit.com/r/GeminiAI/comments/1xwd175/on_a_real_coding_task_hydrogen_matched_38_flash/" },
            { label: "Google launch", url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-hydrogen/" },
          ],
        },
        tradeoff: {
          text: "Speed does not guarantee that every constraint survives. In the Laravel trial, the author reported a required-field mistake that remained at both high and extra effort. Creative-writing reactions also vary: one AI Studio user preferred its prose to 3.1 Pro but not Argon, while another disliked it for roleplay.",
          sources: [
            { label: "r/GeminiAI Laravel trial", url: "https://www.reddit.com/r/GeminiAI/comments/1xwd175/on_a_real_coding_task_hydrogen_matched_38_flash/" },
            { label: "r/GoogleAIStudio writing discussion", url: "https://www.reddit.com/r/GoogleAIStudio/comments/1xunbph/how_good_is_gemini_4_hydrogen_for_creative/" },
          ],
        },
      },
    ],
  },
];
