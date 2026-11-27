# InfoHub motion implementation plan

Prepared 26 November 2026 for the InfoHub maintainer and implementation agent. Baseline: `main` at `ee23bb9823a4bced144d7d5f4b1e04092ccb85da`. The user subsequently authorized implementation after this handoff was completed.

## Intended experience

InfoHub should feel responsive and carefully composed as a colleague moves from a task to a recommendation, then into the evidence. Preserve its porcelain, graphite and vermilion palette, system typography, generous whitespace and conspicuous Everyday, Balanced and Deep work labels.

The signature moments are the first task result arriving, a model identity carrying into its detail page, and comparison controls that visibly explain their changes. Repeated interactions stay fast. Motion enriches real content; it does not imply that a model is thinking, data is loading, or a benchmark is improving.

Five design commitments:

- Product: help colleagues choose a model and supported settings for their work.
- Character: precise, responsive, composed.
- World: a technical reference desk with a vermilion marker for the useful choice.
- Moments: finding a starting point and understanding cost tradeoffs.
- Signature: the same small accent that marks “Start here” also anchors navigation and selection.

## Audit and coverage

The live deployment was inspected on desktop at 1280 px and on mobile at 390 px. The source audit covers all page templates and shared components at the baseline commit. Dynamic routes were sampled with a language model, an image model and the image task category; their shared templates cover other IDs. Error states and populated directory/quality states were source-reviewed, not triggered against production. No model claims, prices or benchmark data are part of this change.

| Surface | Observed baseline | Planned treatment |
| --- | --- | --- |
| `/` | Search hero, task chips, tier explanation and three news items | First-result composition; short feedback; a single restrained page entrance |
| `/tasks` | Same task finder without homepage editorial sections | Reuse exactly the same motion behavior |
| `/tasks/[category]` | Task finder starts with results already present | Render settled; do not simulate submitting a task |
| `/models` | Filterable, sortable family table and image directory | Fast filter updates, sort feedback, clear row affordance and detail continuity |
| `/models/[id]` language | Benchmark strip, sourced behavior, effort cards, sticky facts, sources | Shared identity and quiet section entry; copy confirmation |
| `/models/[id]` image | Use cases, example brief, settings, price and sources | Same continuity and copy behavior; preserve image billing distinctions |
| `/models/explore` | Directory is currently not connected | Honest static status; populated filter/pagination path remains supported |
| `/frontier-personalities` | Claude row, GPT row, six sourced profiles, CSS subgrid | One restrained content entrance; source-link feedback; readable static cards |
| `/compare` cost | Token inputs, four model choices, bars and rates | Moving mode indicator and smoothly retargeted bar lengths |
| `/compare` quality | Currently an evidence explanation | Short content handoff; genuine future plot remains static while axes change |
| `/news` | Topic buttons, articles, native disclosures, empty category | Selection feedback, short result reveal, disclosure treatment |
| `/about` | Five methodology principles | A single page arrival and link feedback |
| Error and not-found | Recovery button or home link | Immediate content, ordinary button feedback, no dramatic animation |
| Global header/footer | Static active dot, mobile menu using display toggles | Persistent shell; moving desktop marker; anchored mobile opening and closing |

### Before and after review

| Before | After | Why |
| --- | --- | --- |
| No shared duration/easing tokens | Explicit feedback, enter, exit and composition tokens | Prevent unrelated interactions acquiring different timing |
| Global press scale snaps on and off | Tiny pointer press with a short release transition | Makes actions feel tactile without delaying activation |
| `.hero-compact` changes spacing and heading size at once | Bounded first-result movement, then settled subsequent searches | Explains the shift into decision mode |
| Dropdown conditionally unmounts immediately | Anchored entrance and a short inert closing phase | Preserves the trigger-to-menu relationship |
| Local toggle thumb jumps 12 px | 140 ms transform transition | Clearly connects state to the switch |
| Native disclosure content appears abruptly | Chevron rotation and brief content reveal | Makes additional evidence easier to track |
| Compare active button swaps background | One moving selection surface | The selected mode feels like one control |
| Bar widths jump on every token input | Transform-based fills that retarget from their displayed position | Shows the effect of assumptions without inventing intermediate numeric facts |
| Copy icon and text swap abruptly | Fixed-space success icon and readable label | Confirms completion without layout disturbance |
| Active navigation dot is recreated per link | One measured indicator that moves between destinations | Adds continuity while retaining the existing identity |
| Reduced-motion CSS addresses normal elements only | Also cancel WAAPI and native transition pseudo-elements | CSS alone does not govern every animation engine |

The unslop review found an already coherent visual direction, not a need for a redesign. Preserve its solid surfaces, real content and quiet chrome. Avoid introducing gradients, glass cards, floating ornaments or a different font. Several secondary text sizes are small; do not make them smaller to accommodate animation.

## Motion system

All durations below are proposed house values, not externally measured performance claims.

| Token | Value | Intended use |
| --- | --- | --- |
| Feedback | 120 ms | Hover surface, border and icon feedback |
| Control | 160 ms | Toggle, chevron, small selection marker |
| Enter | 200 ms | Menus and new result content |
| Exit | 120 ms | Dismissal |
| Compose | 260 ms | First task layout transition and detail continuity |
| Ease | `cubic-bezier(.22,1,.36,1)` | Shared fast response with a soft stop |
| Small distance | 4 px | Dropdown/content arrival |
| Section distance | 8 px maximum | One first arrival |
| Press | `scale(.98)` | Small pointer-operated buttons only |

Do not apply `transition: all`. Name the properties. The default is CSS transitions; use Web Animations API for measured position changes and replayable content entry. Use React ViewTransition only for infrequent route continuity. Content must be visible in its final state when JavaScript, observers or animation APIs are unavailable.

Keyboard interaction is immediate: search shortcut, focus, selection, Enter, Space, Escape and arrow-key list navigation must not wait for an animation. Pointer feedback begins on press, while activation still occurs normally on click. Coarse pointers receive press feedback without hover movement. Reduced motion uses immediate state changes throughout, including route transitions and scrolling.

## Detailed interaction specifications

### Header and navigation

**N1 Desktop marker.** Keep the existing 4 px vermilion dot below the active label. Measure link centers after navigation and resize, then animate a single dot with `translateX` for 160 ms. Do not scale text or slide every link. Initial load and breakpoint changes place it immediately. `/models/explore` and `/models/[id]` retain the Models selection. The homepage and About have no falsely selected primary link. The accessible selection remains `aria-current`, independently of the decorative dot.

**N2 Mobile navigation.** Open from the header with opacity and a 4 px vertical offset over 200 ms. Exit over 120 ms along the same path. Animate the hamburger/close glyph with a small crossfade. Keep the panel mounted only while opening/open/closing; closing content becomes inert immediately. Escape closes and returns focus to the toggle. Link activation closes without waiting. Clicking outside closes. Reset on route and breakpoint changes; do not leave invisible links focusable. Preserve the current nonmodal menu rather than introducing a new full-screen drawer.

**N3 Route arrival.** Keep the header/footer steady. Use one 180–200 ms content arrival rather than independent animation on every section. Never animate the initial heading out of visibility before a page is usable. Hash navigation, browser history, unsupported browsers and reduced motion retain normal behavior. A route animation must not reset scroll restoration or form state.

**N4 Model identity continuity.** On catalog-to-detail navigation, carry the selected model name into the destination heading over 260 ms where supported. Name only the selected identity; avoid snapshotting whole forms, long cards or the complete table. Family IDs differ from configuration IDs, so resolve the canonical family ID before sharing a name. Several variants of one family can appear together: never assign duplicate transition names. If identity or origin visibility is ambiguous, use the normal page arrival. Do not fabricate a reverse morph for browser Back.

### Task finder and recommendations

**T1 Search feedback.** Focus ring remains immediate. Transition border and button availability over 120 ms; move only the arrow by 2 px on fine-pointer hover. Do not animate the placeholder, typed text, privacy label or keyboard shortcut. Keep all task text in memory and out of URLs and analytics.

**T2 First submission.** On the first pointer submission or category selection, capture the current search/shortcut positions, commit the compact layout and results, then translate the surviving elements from their previous positions into the new positions over 260 ms. This is FLIP: measure before and after layout, then animate the inverse transform back to zero. Do not tween padding, margins or font sizes every frame. Reveal the result section as one group with opacity and 6 px movement over 200 ms. No artificial processing delay or spinner. Do not add a three-card stagger on every search. On narrow screens, use only the short group reveal if moving the hero would disorient the user or fight the software keyboard.

**T3 Subsequent changes.** Changing task, priority, scope, workflow or local-only status updates the truth immediately. Reveal the updated result group with an 120–160 ms fade; preserve stable keyed model identities. Cancel any earlier animation when another change arrives. Do not replay the initial hero movement, move focus from a control, or reorder tiers for visual drama. The current recommendation algorithm remains authoritative.

**T4 Ambiguous or unmatched tasks.** The category chooser and constraint empty state receive the same short reveal. They must not inherit a “success” check or a loading pulse. Local setup links remain distinguishable from available models. Announce result count or ambiguity once in a polite status region, not every animation frame.

**T5 Recommendation cards.** Preserve the explicit tier title, description and Start here marker. Add a restrained border/surface response to an interactive descendant's hover/focus. Cards are articles with multiple actions, not giant clickable buttons: no card tilt, card zoom or misleading whole-card pointer cursor. Details links get the shared 2 px arrow feedback; source links stay readable.

**T6 Evidence disclosures.** Retain native `details` and `summary`, including keyboard and no-JavaScript behavior. Rotate the chevron 180 degrees over 160 ms and fade the newly shown evidence over 160 ms. Let layout settle natively; avoid guessed `max-height` values, clipped citations or scaling the prose. Smooth height interpolation is an optional later experiment, not a dependency of this implementation.

**T7 Copy confirmation.** Animate Copy to Check in the same 16 px icon slot; reserve sufficient label width for Settings copied. Show success only after the clipboard promise resolves. Errors stay visible and readable. Subsequent successful copies must clear error state. Keep the status announcement and do not use a global celebratory toast.

### Shared dropdowns and controls

**C1 Dropdown panel.** Enter from the trigger edge using opacity, `translateY(-4px)` and scale no smaller than .98. Enter 200 ms; exit 120 ms. Set transform origin at the actual trigger-facing edge. Preserve typeahead, Home/End, arrow keys, `aria-activedescendant`, Enter/Space, Tab and outside dismissal. Keyboard opening/closing is immediate. A closing panel must not intercept clicks or stay exposed as an open listbox. Reopen during exit from the current visual position instead of waiting.

**C2 Placement.** Before adding motion, prevent menus from escaping the viewport. Clamp horizontally; open upward if available space below is insufficient and above is better. Measure only on open/resize/scroll, not each animation frame. Keep the menu max height and its own scrolling. Direction and transform origin must agree. Long benchmark suite labels must not widen the page.

**C3 Selection.** Selected checkmark and chevron may fade/rotate in 120–160 ms. Active-option keyboard movement remains instant. A selected row and the currently navigated row remain visually distinct. Keep forced-color outlines.

**C4 Switch.** Animate the existing 12 px thumb travel and track color in 140–160 ms, immediately for keyboard/reduced motion. The checkbox state changes on activation, not when its animation ends.

### Model catalog and directory

**M1 Catalog filters.** Typing remains synchronous and unanimated; do not debounce to make an effect visible. On explicit pointer dropdown changes, a short content reveal is allowed. Counts update as whole values. Empty-to-populated transitions use the same group treatment.

**M2 Sorting.** Update sort direction and `aria-sort` immediately. The active arrow rotates or swaps in its reserved slot. A brief table-body reveal makes the new order legible. Optional later experiment: position-only FLIP of visible rows in 200 ms, only after table layout and scrolling are verified; avoid whole-table scale or fly-in rows. Missing benchmark values remain dashes and never count through zero.

**M3 Row links.** Use a neutral row surface, clear name focus and a 2 px directional arrow response. Preserve semantic table cells, sticky columns and horizontal overflow. Do not make metadata or benchmark cells appear independently clickable.

**M4 Broader directory.** Keep the disconnected/failure status static. In a populated snapshot, search submits the existing GET form and pagination uses existing links. Do not serialize private task text into this public model-name search. New result pages receive the route treatment without animating each of the 30 rows. Filters, counts, source coverage and page number remain intact. Test the populated path with an isolated fixture, not a published fake catalog.

### Detail pages and Frontier Personalities

**D1 Detail arrival.** After identity continuity, let the benchmark strip and page content settle as one composition. Display scores at final values immediately; never roll through fabricated benchmark scores. Keep the sticky facts panel outside transformed ancestors so its positioning remains correct.

**D2 Effort cards and image setup.** Use the shared copy state, links and restrained interaction feedback. Keep effort cards in their current reading order. Do not turn them into a new tabbed experience or hide evidence behind a carousel.

**D3 Sources.** Transition underline color and the small external-link arrow on fine-pointer hover. Keyboard focus is immediate. Preserve dates, source kind, caveats and distinction between provider facts and editorial fit.

**P1 Frontier Personalities.** Keep Claude above GPT and the desktop three-column subgrid. Use the page arrival once. Optional modest refinement: each provider group can reveal as one unit when it first appears, 200 ms / 6 px, without replaying during upward scrolling. Mobile uses one-column reading order with no card-by-card stagger. No moving trait meters, personality scores, animated avatars or invented model behaviors.

### Comparison

**Q1 Mode switch.** One neutral selection surface moves under the two existing buttons over 180 ms, with text color changing in the same interval. Keep button semantics and `aria-pressed`; do not add incomplete tab semantics. Content transitions over 160–200 ms as one region. Controls remain immediately usable and quick repeated clicks cancel prior effects.

**Q2 Cost bars.** Replace per-frame width animation with a full-width fill and `scaleX(ratio)` from the left edge. CSS retargets the transform in 200 ms whenever a valid assumption changes. Render exact formatted prices immediately. The currently cheapest highlight changes with the actual sort, not a timer. Do not animate an unavailable cost from/to zero. All-zero inputs show truly zero bars. Keep the chart description and table aligned with the same data.

**Q3 Added and removed selections.** Fade a new bar row briefly; preserve model IDs. Removing the last selection shows the existing helpful empty state. The four-model cap remains visible and enforced. Do not slide all checkbox options as the selection changes.

**Q4 Quality plot.** Today the explanatory panel uses the same mode transition. When matched measurements exist, retain its SVG and accessible table. Fade the data layer on a suite change; axes and labels switch directly to the new units. Never interpolate a point between incompatible benchmark suites. Optional point focus highlight requires a keyboard/touch equivalent before it can ship.

**Q5 Provider benchmarks.** Table values remain static. The jump link uses normal anchor navigation with a short nonflashing target outline to orient the reader. Do not add global smooth scrolling or transform the table.

### News and methodology

**R1 News filters.** The selected button changes surface over 120 ms; the resulting article group arrives in 160 ms. Preserve `eventKey` identity and meaningful open disclosures on surviving items. Repeated changes cancel earlier reveals. Announce the result count once. Empty categories remain honest empty states.

**R2 Articles.** External-link arrow feedback and the same native disclosure treatment as recommendation evidence. Time-sensitive labels remain static: urgency is expressed by wording, not pulsing. The homepage's three articles inherit these behaviors automatically.

**R3 About and homepage guidance.** Page/group arrival, link feedback and otherwise still reading surfaces. The three tier explanation rows may arrive as a single unit; do not turn the dollar signs into a running counter. The five methodology sections need no separate scroll choreography.

**R4 Errors, warnings and recovery.** Show warnings immediately and retain status semantics. Use ordinary button feedback for Try again and Back to InfoHub. No shakes, pulses, countdowns or automatic retries. `/api/health` has no motion work.

## Technical approach and boundaries

The baseline pins Next.js 16.4.6 and React 19.3.1. Current primary documentation confirms that React ViewTransition is stable in 19.3 and Next.js App Router needs no experimental flag. Do not copy older tutorials that add `experimental.viewTransition`.

Use CSS for local controls and WAAPI for short, cancelable group effects. Use native React view transitions selectively for model identity and route changes. Browser Back/Forward preserve native restoration; they do not need an invented animation. Native snapshots are not a substitute for retargetable control motion. Named snapshot participants have interaction limitations, so keep fast controls and navigation outside them and test rapid navigation.

Do not add Motion, GSAP, a smooth-scroll engine or a new component library by default. Motion remains a fallback if a measured prototype proves native/CSS/WAAPI insufficient for complex layout continuity. It would require a pinned version, a measured bundle delta and reduced-motion integration. No dependency is justified by rotating a chevron.

Recommended file ownership:

| File | Responsibility |
| --- | --- |
| `src/app/globals.css` | Tokens, feedback, menus, selection surfaces, bar fills, route pseudo-elements and media overrides |
| `src/components/motion.tsx` | Small client utility for input modality, reduced-motion cancellation, group reveal and measured FLIP |
| `src/components/site-header.tsx` | Marker and mobile menu lifecycle |
| `src/components/dropdown.tsx` | Placement, anchored transition and dismissal lifecycle |
| `src/components/task-finder.tsx` | First result and subsequent update orchestration |
| `src/components/model-card.tsx` | Shared disclosure and detail identity hooks |
| `src/components/copy-settings.tsx` | Accessible copy feedback |
| `src/components/model-catalog-table.tsx` | Filter/sort feedback and identity |
| `src/components/comparison.tsx` | Mode surface, bar transforms and chart state handoff |
| `src/components/news-feed.tsx`, `news-list.tsx` | Filter group and disclosure behavior |
| `src/app/models/[id]/page.tsx` | Matching model identity and detail composition |
| Other `page.tsx` files and personality CSS module | One shared arrival only where useful |
| `docs/DESIGN.md`, `DECISIONS.md`, `LEARNINGS.md` | Record the final motion contract and verified limitations |

Server catalog reads stay on the server. Passing server-rendered children through a small client motion boundary is acceptable; converting all pages and source data into client components is not. Do not key the whole application by pathname or remount persistent forms just to trigger an entrance. Use stable model IDs and news event keys. Cancel animations/listeners/observers on unmount and when reduced motion is enabled mid-session. Do not assume `transitionend` fires when duration is zero.

## Build sequence

1. Establish a clean checkout from the baseline/current main and preserve the existing dirty workspace. Save this plan before implementation.
2. Add motion tokens and cancellation/modality utilities. Apply button, link, toggle, copy and native-disclosure feedback.
3. Implement dropdown placement/lifecycle and mobile navigation. Verify keyboard and rapid re-entry before spreading the patterns.
4. Add task finder first-result composition and result updates. Cover ambiguity, image workflows and local constraints.
5. Add compare selection/bar behavior and catalog/news filtering feedback.
6. Add route/model identity continuity, then page treatment for static/editorial/directory/detail pages. Keep enhancement failures isolated.
7. Test, review at normal and slow playback, update maintenance docs, run `npm run ci`, commit, push and open a PR with preview. Do not merge without authorization.

Optional experiments (not required for the first complete release): per-row FLIP sorting, provider-group scroll reveal, matched point focus, and smoothly interpolated native disclosure height. These should not delay or destabilize the complete core pass. The route and first-result experiments must degrade to a quick fade if their visual continuity is worse on mobile.

## Acceptance and validation

- Every page template retains content, order, links, units and data. No new model assertions or changes to recommendation logic.
- Pointer controls acknowledge immediately. Repeated dropdown opening/closing and category/filter changes never queue obsolete states.
- Tab, Shift+Tab, Enter, Space, Escape, arrows, Home/End, typeahead and `/` behave as before or better. Focus never lands in a closing menu.
- Reduced motion produces immediate controls, no FLIP, no route morphs and no hidden content. Toggle it while an animation is running.
- At 390, 768 and 1280/1440 px, verify menu placement, wrapped labels, three tiers, long model names, horizontal tables, sticky facts and mobile navigation. Include 200% text zoom.
- Exercise first task selection, repeated category change, ambiguous text, no match, local-only, all image workflows, copy success/failure, disclosure reopen, catalog sort/filter/empty, news filter/empty and compare invalid/zero inputs/four-selection cap/no selection.
- Check direct links, ordinary internal links, browser Back/Forward, hash links, refresh, new-tab links and reduced-motion navigation. Verify native transition behavior in Chromium, Safari and Firefox when available; record untested browsers.
- Test populated directory and comparable quality plot with private fixtures; never commit synthetic published data.
- Inspect the console for hydration errors and duplicate transition names. Compare bundle/build output with baseline. Avoid animation-induced layout shifts on initial load; do not hide the LCP heading for an entrance.
- Use a browser performance trace for the largest interaction. There must be no perpetual animation at rest, no sustained per-frame layout work from control animations and no accumulating detached nodes/listeners.
- Run `npm run ci` and inspect GitHub/Vercel results. A draft or untested deployment must not be described as production-ready.

## Research and source notes

The exact timings and component prescriptions above are design proposals for InfoHub. The following primary sources establish the techniques and constraints, checked 26 November 2026.

1. [Apple design skill at the pinned source](https://github.com/emilkowalski/skills/tree/64eb3deb9a5fbfa041faf783e0bc3fd635872e9c/skills/apple-design): immediate feedback, spatial continuity and interruptibility. Applied to controls and origin-aware surfaces; not used as a reason to introduce glass or gesture-heavy navigation.
2. [Emil design engineering at the pinned source](https://github.com/emilkowalski/skills/tree/64eb3deb9a5fbfa041faf783e0bc3fd635872e9c/skills/emil-design-eng) and [Good vs Great Animations](https://emilkowal.ski/ui/good-vs-great-animations): purposeful timing, anchored menus and coordinated selection. The local skill's keyboard and frequency guidance informs the immediate keyboard path.
3. [Unslop by Damir Sokolovsky](https://github.com/heydamir/unslop/tree/620163eedb3529d9cd23a3994ed8d287d06f760d/skills/unslop), CC BY 4.0: concentrate visual richness in meaningful content and preserve quiet chrome. Attribution is retained in the repository notices and this plan.
4. [IBM Carbon motion](https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview): separates everyday productive feedback from occasional expressive moments. Applied to fast controls versus the first result and detail transition; no Carbon dependency is proposed.
5. [React 19.3 release](https://react.dev/blog/2026/09/09/react-19-3): ViewTransition graduated to stable. [React ViewTransition reference](https://react.dev/reference/react/ViewTransition): transition triggers, shared names and explicit reduced-motion responsibility. Ordinary urgent updates should stay urgent.
6. [Next.js view transitions guide](https://nextjs.org/docs/app/guides/view-transitions): current App Router setup, shared-element examples, browser history behavior and snapshot hit-testing caveats. Prefer its current integration over hand-wrapping router updates in DOM snapshot calls. Keep a usable fallback.
7. [MDN View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) and [Chrome same-document examples](https://developer.chrome.com/docs/web-platform/view-transitions/same-document): browser snapshots, named elements and capability fallback. Useful inspiration for model identity continuity, not full-screen wipes.
8. [Motion layout animation documentation](https://motion.dev/docs/react-layout-animations): transform-based layout animation, shared identities and text distortion tradeoffs. A technically valid alternative for complex future interactions; not a required package for this pass.
9. [MDN starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style): CSS entry styles are progressively enhanceable. They do not by themselves animate an already unmounted React element's exit.
10. [MDN interpolate-size](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/interpolate-size): intrinsic size interpolation still has limited availability. This plan keeps disclosure semantics and content available without depending on it.
11. [web.dev animation performance guide](https://web.dev/articles/animations-guide): prefer transforms/opacity, inspect paint and avoid indiscriminate `will-change`. A compositor-friendly property still needs real profiling on the final page.
12. [W3C animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html): users must be able to disable nonessential interaction-triggered motion for this Level AAA criterion. Reduced motion is a product requirement here; this alone is not a claim of complete WCAG conformance.

## Implementation handoff

Implement the core specifications in this file against the latest InfoHub main branch. Recheck changed files against the audited baseline. Preserve the brand, content and recommendation behavior. Start with shared CSS/WAAPI patterns, use native React transitions only where their lifecycle is suitable, and keep optional experiments separate. Verify the acceptance flows, document any unavailable validation honestly, then commit, push and open a preview PR. Do not merge to production automatically.

## Implementation notes, 27 November 2026

The initial implementation uses the shared CSS and small animation utility described above, including first-result composition, native view-transition enhancements, responsive dropdown placement, mobile navigation, disclosure/copy feedback, catalog and news reveals, and retargetable comparison bars. The moving navigation marker is implemented on desktop. Dynamic directory and measured-quality content retain their existing static behavior until real data is available. The optional experiments remain future work. Entry/exit effects are enhancements; unsupported view-transition browsers keep normal navigation.

Local verification used the cached analytics 1.6.1 package because the pinned 2.0.1 package could not be downloaded in the restricted execution environment. GitHub/Vercel must validate the actual locked dependency. Keyboard and reduced-motion behavior has been designed into the implementation; automated cross-browser and reduced-motion-toggle coverage, populated-data fixtures, zoom testing, and performance traces remain follow-up validation rather than claimed results.
