# InfoHub design direction

InfoHub should feel calm and useful within seconds. **Empty space is part of the interface:** it separates decisions, gives explanations room, and lets one important action stand out.

## Five-line direction

- **Product:** Help MSP colleagues choose an AI model and thinking setting for their current work.
- **Character:** Calm, precise, approachable.
- **World:** A well-organized technical reference desk: porcelain surfaces, graphite text, and a vermilion marker for the useful choice.
- **Moments:** The recommended model/settings combination and a readable cost-versus-quality plot.
- **Signature:** A consistent “Start here → Step up when…” explanation showing the smallest sufficient choice.

## Color and type

Use two primary colors plus one contrasting accent:

| Role | Color | Use |
| --- | --- | --- |
| Porcelain | #F7F7F5 | Main background and quiet space |
| Graphite | #202124 | Main text, wordmark, and strong structure |
| Vermilion | #D93920 | Primary action, selected choice, and selected chart point |

Supporting neutrals are white surfaces, #595B60 secondary text, #6B6D72 metadata, and subtle neutral dividers. These are tonal support, not competing brand colors. Verify actual foreground/background combinations before shipping; use white text on vermilion only if the measured contrast passes.

Avoid making the accent resemble an error state: recommendations have explicit text and selection styling; errors include an icon and a specific message. Do not use color alone for any meaning.

Use the platform system font stack with a sans-serif fallback. Body text starts at 16 px with a comfortable line height; metadata can be 13–14 px. Use mainly weights 400 and 500, with 600 sparingly. Tabular numerals help price and benchmark alignment. Sentence case throughout.

## Whitespace and density

- Keep the homepage's task area to roughly 760 px and its broader content to about 1200 px. Comparison pages may use more width for readable charts and tables.
- Desktop page gutters: 48–64 px where space permits. Mobile gutters: 20–24 px.
- Between major sections: 64–80 px on desktop; 40–48 px on mobile.
- Within result cards: 24–32 px padding; between separate thoughts: 12–16 px.
- Keep explanation lines around 55–70 characters. Do not stretch short text across a wide display.
- Prefer fewer visible items over smaller text. Show three news items on the homepage; the News page carries the rest.
- Do not fill gaps with badges, icons, sparklines, statistics, or decorative cards.
- Preserve useful whitespace at every screen size. It must not become clipped controls, tiny text, or a giant empty hero that hides the product.

Use a 4 px spacing scale expressed in relative units where it supports text resizing. Cards and controls use consistent radii: approximately 16 px for cards and 8 px for controls.

## Homepage composition

~~~text
InfoHub                         Tasks    Compare    News


              Choose the right model for the job
           Practical choices for the work in front of you

           [ What do you need to get done?        Find ]

             Coding   Debugging   Networking
             Cybersecurity   Research   Writing


Latest for your work                            All news
Title and short relevance note                        Date
Title and short relevance note                        Date
Title and short relevance note                        Date
~~~

This is a short functional hero, not a marketing splash screen. The search is the first visual priority. The news list appears after a deliberate gap and stays secondary. No stock hero artwork is needed.

## Recommendation composition

Show one clear recommendation first, with up to two alternatives nearby or below. On mobile, stack in recommendation order. Three comparable price bands may share a row, but the entire application should not become repeated identical cards.

Each card can use these five short content lines:

1. Best for a specific scope of work.
2. A realistic example of that work.
3. The thinking setting and why it is sufficient.
4. What this choice struggles with or needs from the prompt.
5. When paying for the next band is justified.

Example editorial pattern, not a real model endorsement:

> Everyday · routine scripting
>
> Use for a small script with clear inputs and expected output
>
> Example: convert a sanitized inventory export into a summary
>
> Start with the least intensive supported setting that passed this task type
>
> Step up for unclear failures, multiple interacting systems, or repeated unsuccessful attempts

Use the real model name and verified setting when data is available. Put longer notes and sources behind “Why this choice?” rather than forcing them into the main card.

## Navigation and interactions

Use quiet top navigation for Tasks, Compare, and News; a task category bar lives within Tasks. A full sidebar is unnecessary for the initial number of destinations. On mobile, use a simple accessible menu.

Give input labels, selected states, empty results, loading states, and recoverable errors the same care as the ideal screen. Do not conceal essential content behind hover.

Respond immediately to presses. Keep keyboard interactions instant and ordinary transitions short, typically 120–200 ms. Animate opacity or transform only where it clarifies a change. No card hover scaling, continuous decorative movement, staggered card entrances on every search, or animated chart axes.

Reduced-motion users receive static transitions or brief fades. Respect text zoom and high contrast. Target at least 44 px touch areas for primary controls, even when their visible icon is smaller.

For charts, selected data gets the accent; the rest stays neutral. Use labels and point shapes where needed to distinguish providers. Match exact units and provide an accessible table.

## Applying the requested skills

1. Read [apple-design](../.agents/skills/apple-design/SKILL.md) for predictability, feedback, typography, and accessible interaction.
2. Read [emil-design-eng](../.agents/skills/emil-design-eng/SKILL.md) while implementing controls, menus, and transitions.
3. Use [unslop](../.agents/skills/unslop/SKILL.md) to audit the working screens in this order: spacing, color, icons, copy, type, layout, details, visuals, motion.
4. Validate the result visually and with real task content, long model names, missing prices, and narrow screens.

The explicit product brief takes precedence over generalized skill examples: keep the generous whitespace, short functional hero, and compact top navigation. Restrained solid surfaces suit this tool better than glass across the whole interface. Keep the selected direction stable while applying small refinements.

Upstream source versions and attribution are recorded in the repository's third-party notices. Optional skills referenced by upstream documents are not all installed; fetch and read a relevant one only when an implementation task needs it.
