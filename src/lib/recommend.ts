import { categoryIds, type CategoryId, type ImageWorkflow, type ModelVariant, type Priority, type Recommendation, type TaskInterpretation, type Tier } from "./types";

const cues: Record<CategoryId, RegExp[]> = {
  images: [/\b(?:images?|photos?|pictures?|artwork|illustrat(?:e|ion|ions)|visual asset|banner|poster|flyer|thumbnail|product shot|text.to.image|mock.?up|logo|background removal)\b/gi],
  marketing: [/\b(?:marketing|campaign|sales|proposal|linkedin|social media|webinar|landing page|newsletter|ad copy|advertis(?:e|ement|ing)|case study|product launch)\b/gi],
  presentations: [/\b(?:presentations?|slides?|slide deck|powerpoint|pitch deck|keynote|speaker notes|talk track)\b/gi],
  analysis: [/\b(?:spreadsheet|excel|google sheets|pivot table|csv|kpis?|dashboard|formula|monthly trend|revenue trend|compare quarters|renewals|charts?)\b/gi],
  coding: [/\b(?:code|coding|script|scripting|powershell|python|bash|terraform|ansible|javascript|typescript|sql|implement|refactor|program|function|automation)\b/gi],
  debugging: [/\b(?:debug|debugging|bug|bugs|error|errors|exception|crash|crashes|failing|failure|broken|troubleshoot|troubleshooting|stack trace|root cause|doesn.t work)\b/gi],
  networking: [/\b(?:network|networking|firewall|routing|router|switch|dns|dhcp|vlan|vpn|bgp|ospf|tcp|packet|subnet|connectivity|latency)\b/gi],
  security: [/\b(?:security|cybersecurity|siem|soc|logs|detection|threat|malware|phishing|vulnerability|vulnerabilities|ransomware|incident|breach|attack|suspicious|cve|ioc|hardening)\b/gi],
  research: [/\b(?:research|compare|comparison|investigate|evaluate|evaluation|architecture|architectural|design|trade.?offs|sources|citations|literature|survey|evidence|find out)\b/gi],
  writing: [/\b(?:write|writing|draft|rewrite|summarize|summarise|summary|email|document|documentation|customer update|proofread|translate|translation|report|explain|message|announcement)\b/gi],
};

// Deliverables and common symptoms carry more intent than a technology name alone.
const intentPhrases: Partial<Record<CategoryId, RegExp>> = {
  debugging: /\b(?:crashloopbackoff|(?:pods?|containers?|services?)\s+(?:keep\s+)?(?:restarting|timing out)|keeps? (?:restarting|timing out|crashing)|(?:pods?|containere?|tjenester?)\s+(?:bliver ved med at genstarte|genstarter)|fejlsøg\w*|virker ikke|går ned)\b/u,
  coding: /\b(?:automatiser\w*|skriv\s+(?:et script|kode)|byg\s+en integration|tilføj\s+en funktion|add\s+(?:a feature|an endpoint))\b/u,
  networking: /\b(?:netværk\w*|forbindelse mellem|kan ikke nå|route traffic between)\b/u,
  security: /\b(?:sikkerhedshændelse\w*|mistænkelig aktivitet|gennemgå sikkerhedslog\w*)\b/u,
  research: /\b(?:undersøg\w*|sammenlign\w*|find kilder|weigh (?:the )?options)\b/u,
  writing: /\b(?:kundeopdatering\w*|omskriv\w*|oversæt\w*|skriv\s+(?:en mail|et svar)|tell (?:the|our) (?:client|customer))\b/u,
  analysis: /\b(?:regneark\w*|salgstal\w*|find mønstre i|group (?:the )?data by)\b/u,
  presentations: /\b(?:præsentation\w*|oplæg\w*|dias|slides til|turn .* into slides)\b/u,
  marketing: /\b(?:kampagne\w*|salgsoplæg\w*|opslag til linkedin|linkedin[- ]opslag)\b/u,
  images: /\b(?:produktfoto\w*|billedredigering\w*|(?:lav|generér|redigér) (?:et billede|en plakat)|fjern baggrunden)\b/u,
};

function interpretPriority(text: string): Priority | undefined {
  const explicit = text.replace(/\b(?:not|no need for|ikke)\s+(?:a\s+)?(?:quick|fast|thorough|cheap|hurtig\w*|grundig\w*|billig\w*)\b/g, "");
  const speed = /\b(?:quick(?:ly)?|fast(?:est)?|low latency|hurtig\w*)\b/.test(explicit);
  const quality = /\b(?:thorough(?:ly)?|highest quality|quality over speed|take your time|grundig\w*|højeste kvalitet)\b/.test(explicit);
  if (quality) return "quality";
  if (speed) return "speed";
  if (/\b(?:cheap(?:est)?|low cost|on a budget|good value|billig\w*|lav pris)\b/.test(explicit)) return "value";
}

export function interpretImageWorkflow(text: string): ImageWorkflow {
  if (/\b(?:fjern baggrunden|redigér|retouchér)\b/i.test(text)) return "edits";
  if (/\b(?:plakat|med tekst|med en overskrift)\b/i.test(text)) return "layout";
  if (/\b(?:edit|retouch|remove|replace|re.?light|crop|restore|cut ?out)\b[^.!?]{0,65}\b(?:image|photo|picture|product shot|background|lighting|reflection|glare|object|logo)s?\b|\b(?:existing|original|supplied|attached|reference)\s+(?:image|photo|picture)\b/i.test(text)) return "edits";
  if (/\b(?:poster|flyer|typography|text.?heavy|infographic|lettering|headline|with text|with (?:a |the )?title)\b/i.test(text)) return "layout";
  return "concepts";
}

function requiresLocal(text: string): boolean {
  // Remove explicit negations of the constraint before looking for positive requirements.
  const positive = text.replace(/[-–—]/g, " ")
    .replace(/\b(?:locally only|only locally|only local(?=\s+(?:models?|inference|ai|processing)\b))\b/gi, "local only")
    .replace(/\b(?:not|never|no longer)\s+(?:strictly\s+)?(?:local[ -]only|offline[ -]only|offline)\b/gi, "")
    .replace(/\b(?:don['’]?t|do not|does not|doesn['’]?t|need not)\s+(?:need|require|have to be|have to run|want)?\s*(?:to\s+)?(?:be\s+|run\s+)?(?:local(?:[ -]only)?|offline)\b/gi, "")
    .replace(/\bno need (?:for|to (?:be|run))\s+(?:local(?:[ -]only)?|offline)\b/gi, "")
    .replace(/\b(?:local[ -]only|offline)\s+(?:is\s+)?not\s+(?:required|necessary)\b/gi, "");
  return /\b(?:kun lokal(?:t|e)?|uden cloud|(?:data|det) skal blive (?:lokalt|på (?:min|vores) (?:maskine|enhed)))\b/i.test(
    positive.replace(/\bikke kun lokal(?:t|e)?\b/gi, ""),
  ) || /\b(?:local[ -]only|offline|on[ -]prem(?:ises)?|air[ -]gapped|must (?:stay|remain|run) local(?:ly)?|run locally|keep (?:it|data|everything) local|(?:data )?must (?:stay|remain) on (?:my |the )?(?:device|machine))\b/i.test(positive)
    || /\b(?:do not|don['’]?t|never|cannot|can['’]?t|must not)\s+(?:want to\s+)?(?:send|upload|share|use|leave)\b[^.!?;]{0,65}\b(?:cloud|hosted|external|device|machine)\b/i.test(positive)
    || /\b(?:no cloud|without (?:the )?cloud|avoid (?:the )?cloud|data (?:must|should) not leave (?:my |the )?(?:device|machine|network))\b/i.test(positive);
}

export function interpretTask(text: string): TaskInterpretation {
  const normalized = text.toLowerCase();
  const counts = categoryIds.map((category) => ({ category, count: cues[category].reduce((sum, cue) => sum + [...normalized.matchAll(cue)].length, 0) }));
  const boost = (category: CategoryId, amount: number) => { counts.find(item => item.category === category)!.count += amount; };
  for (const category of categoryIds) {
    if (intentPhrases[category]?.test(normalized)) boost(category, 5);
  }
  if (/\b(?:lav|byg|forbered) (?:en |et )?(?:præsentation|oplæg)\b/.test(normalized)) boost("presentations", 3);
  // Strong action cues separate common overlaps such as writing a script or debugging Python.
  if (/\b(?:script|code|function|powershell|python|bash|terraform|ansible)\b/.test(normalized)) counts.find((item) => item.category === "coding")!.count += 1;
  if (/\b(?:debug|debugging|troubleshoot|troubleshooting|root cause|stack trace)\b/.test(normalized)) counts.find((item) => item.category === "debugging")!.count += 2;
  if (/\b(?:draft|rewrite|email|customer update|proofread|translate)\b/.test(normalized)) counts.find((item) => item.category === "writing")!.count += 2;
  const imageRequest = /\b(?:generate|create|design|edit|retouch|make|remove|replace|illustrate|produce|draw)\b(?:(?!\b(?:presentation|slides?|deck|ad copy|post copy)\b)[^.!?]){0,85}\b(?:images?|photos?|pictures?|artwork|illustration|banner|poster|flyer|thumbnail|product shot|background|mock.?up|logo)\b/.test(normalized)
    || /\b(?:product photo|text.to.image|image generation|campaign visuals|image editing)\b/.test(normalized);
  if (imageRequest) boost("images", 7);
  if (/\b(?:image|photo|picture|poster|flyer|banner|artwork)s?\b/.test(normalized)) boost("images", 2);
  if (/\b(?:marketing|campaign|linkedin|sales proposal|landing page|ad copy|case study|social media)\b/.test(normalized)) boost("marketing", 3);
  if (/\b(?:slide deck|slides?|powerpoint|presentation|pitch deck|speaker notes)\b/.test(normalized)) boost("presentations", 5);
  if (/\b(?:spreadsheet|excel|csv|pivot table|google sheets|formula)\b/.test(normalized)) boost("analysis", 5);
  if (/\b(?:analy[sz]e|summari[sz]e|explain)\b[^.!?]{0,65}\b(?:chart|kpis?|renewals|revenue|sales data|rows|columns)\b/.test(normalized)) boost("analysis", 3);
  const matches = counts.filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
  const top = matches[0];
  // A one-point lead between two substantial matches is worth clarifying.
  const alternate = matches[1];
  const ambiguous = top && alternate && (alternate.count === top.count || (alternate.count >= 4 && top.count - alternate.count === 1));
  return {
    category: top && !ambiguous ? top.category : null,
    alternatives: ambiguous ? matches.filter((item) => item.count >= alternate.count).map((item) => item.category) : matches.slice(1).filter((item) => item.count >= (top?.count ?? 0) - 1).map((item) => item.category),
    complexity: /\b(?:complex|complicated|advanced|deep|multi[ -]?(?:step|system|service)|distributed|intermittent|race condition|root cause|architecture|architectural|production outage|large codebase|hard|difficult|tilbagevendende|periodisk|kompleks\w*|tværgående)\b/.test(normalized.replace(/\b(?:not|isn['’]?t|is not)\s+(?:complex|complicated|hard|difficult)\b/g, "")) ? "complex" : "routine",
    localOnly: requiresLocal(normalized),
    priority: interpretPriority(normalized),
    ...(top?.category === "images" ? { imageWorkflow: interpretImageWorkflow(normalized) } : {}),
  };
}

export function guidanceFor(model: ModelVariant, category: CategoryId, workflow: ImageWorkflow = "concepts") {
  return category === "images" ? model.image?.workflows[workflow] : model.image ? undefined : model.guidance[category];
}

export function recommend(models: ModelVariant[], category: CategoryId, options: { priority: Priority; localOnly: boolean; complexity: "routine" | "complex"; imageWorkflow?: ImageWorkflow }): Recommendation[] {
  const order: Tier[] = options.priority === "speed" ? ["everyday", "balanced", "deep"]
    : options.complexity === "complex" ? options.priority === "quality" ? ["deep", "balanced", "everyday"] : ["balanced", "everyday", "deep"]
    : options.priority === "quality" ? ["balanced", "everyday", "deep"] : ["everyday", "balanced", "deep"];
  const getGuidance = (model: ModelVariant) => guidanceFor(model, category, options.imageWorkflow);
  const eligible = models.filter(model => model.availability === "available" && (!options.localOnly || model.deployment === "local") && getGuidance(model));
  const selected: ModelVariant[] = [];
  const seen = new Set<string>();
  const append = (model: ModelVariant) => {
    const key = `${model.provider}|${model.modelId}|${model.deployment}|${JSON.stringify(Object.entries(model.setting.parameters).sort(([a], [b]) => a.localeCompare(b)))}`;
    if (seen.has(key) || selected.some((item) => item.id === model.id)) return;
    seen.add(key); selected.push(model);
  };
  // A review can contain a caution. Only an explicit editorial citation makes it
  // support a recommendation for this task.
  const supportsChoice = (model: ModelVariant) => {
    const citation = getGuidance(model)?.evidenceUrl;
    return Boolean(citation && model.observations?.some(note => note.url === citation && note.tasks.includes(category)));
  };
  const choose = (candidates: ModelVariant[]) => {
    const supported = candidates.filter(supportsChoice);
    const pool = supported.length ? supported : candidates;
    const preferred = pool.filter(model => getGuidance(model)?.preferred);
    const peers = preferred.length ? preferred : pool;
    // For equally supported alternatives, offer another developer when possible.
    return peers.find(model => selected.every(pick => pick.developer !== model.developer)) ?? peers[0];
  };
  const imagePick = category === "images" ? eligible.find(model => getGuidance(model)?.preferred) : undefined;
  if (imagePick) append(imagePick);
  for (const tier of order) {
    if (tier === imagePick?.tier) continue;
    const candidates = eligible.filter((model) => model.tier === tier);
    const candidate = choose(candidates);
    if (candidate) append(candidate);
  }
  for (const model of eligible) { if (selected.length >= 3) break; append(model); }
  return selected.slice(0, 3).map((model, index) => ({ model, category, guidance: getGuidance(model)!, recommended: index === 0 }));
}
