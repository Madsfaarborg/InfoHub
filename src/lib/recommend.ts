import { categoryIds, type CategoryId, type ModelVariant, type Priority, type Recommendation, type TaskInterpretation, type Tier } from "./types";

const cues: Record<CategoryId, RegExp[]> = {
  coding: [/\b(?:code|coding|script|scripting|powershell|python|bash|terraform|ansible|javascript|typescript|sql|implement|refactor|program|function|automation)\b/gi],
  debugging: [/\b(?:debug|debugging|bug|bugs|error|errors|exception|crash|crashes|failing|failure|broken|troubleshoot|troubleshooting|stack trace|root cause|doesn.t work)\b/gi],
  networking: [/\b(?:network|networking|firewall|routing|router|switch|dns|dhcp|vlan|vpn|bgp|ospf|tcp|packet|subnet|connectivity|latency)\b/gi],
  security: [/\b(?:security|cybersecurity|siem|soc|logs|detection|threat|malware|phishing|vulnerability|vulnerabilities|ransomware|incident|breach|attack|suspicious|cve|ioc|hardening)\b/gi],
  research: [/\b(?:research|compare|comparison|investigate|evaluate|evaluation|architecture|architectural|design|trade.?offs|sources|citations|literature|survey|evidence|find out)\b/gi],
  writing: [/\b(?:write|writing|draft|rewrite|summarize|summarise|summary|email|document|documentation|customer update|proofread|translate|translation|report|explain|message|announcement)\b/gi],
};

function requiresLocal(text: string): boolean {
  // Remove explicit negations of the constraint before looking for positive requirements.
  const positive = text.replace(/[-–—]/g, " ")
    .replace(/\b(?:locally only|only locally|only local(?=\s+(?:models?|inference|ai|processing)\b))\b/gi, "local only")
    .replace(/\b(?:not|never|no longer)\s+(?:strictly\s+)?(?:local[ -]only|offline[ -]only|offline)\b/gi, "")
    .replace(/\b(?:don['’]?t|do not|does not|doesn['’]?t|need not)\s+(?:need|require|have to be|have to run|want)?\s*(?:to\s+)?(?:be\s+|run\s+)?(?:local(?:[ -]only)?|offline)\b/gi, "")
    .replace(/\bno need (?:for|to (?:be|run))\s+(?:local(?:[ -]only)?|offline)\b/gi, "")
    .replace(/\b(?:local[ -]only|offline)\s+(?:is\s+)?not\s+(?:required|necessary)\b/gi, "");
  return /\b(?:local[ -]only|offline|on[ -]prem(?:ises)?|air[ -]gapped|must (?:stay|remain|run) local(?:ly)?|run locally|keep (?:it|data|everything) local|(?:data )?must (?:stay|remain) on (?:my |the )?(?:device|machine))\b/i.test(positive)
    || /\b(?:do not|don['’]?t|never|cannot|can['’]?t|must not)\s+(?:want to\s+)?(?:send|upload|share|use|leave)\b[^.!?;]{0,65}\b(?:cloud|hosted|external|device|machine)\b/i.test(positive)
    || /\b(?:no cloud|without (?:the )?cloud|avoid (?:the )?cloud|data (?:must|should) not leave (?:my |the )?(?:device|machine|network))\b/i.test(positive);
}

export function interpretTask(text: string): TaskInterpretation {
  const normalized = text.toLowerCase();
  const counts = categoryIds.map((category) => ({ category, count: cues[category].reduce((sum, cue) => sum + [...normalized.matchAll(cue)].length, 0) }));
  // Strong action cues separate common overlaps such as writing a script or debugging Python.
  if (/\b(?:script|code|function|powershell|python|bash|terraform|ansible)\b/.test(normalized)) counts.find((item) => item.category === "coding")!.count += 1;
  if (/\b(?:debug|debugging|troubleshoot|troubleshooting|root cause|stack trace)\b/.test(normalized)) counts.find((item) => item.category === "debugging")!.count += 2;
  if (/\b(?:draft|rewrite|email|customer update|proofread|translate)\b/.test(normalized)) counts.find((item) => item.category === "writing")!.count += 2;
  const matches = counts.filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
  const top = matches[0];
  const ambiguous = top && matches[1]?.count === top.count;
  return {
    category: top && !ambiguous ? top.category : null,
    alternatives: ambiguous ? matches.filter((item) => item.count === top.count).map((item) => item.category) : matches.slice(1).filter((item) => item.count >= (top?.count ?? 0) - 1).map((item) => item.category),
    complexity: /\b(?:complex|complicated|advanced|deep|multi[ -]?(?:step|system|service)|distributed|intermittent|race condition|root cause|architecture|architectural|production outage|large codebase|hard|difficult)\b/.test(normalized.replace(/\b(?:not|isn['’]?t|is not)\s+(?:complex|complicated|hard|difficult)\b/g, "")) ? "complex" : "routine",
    localOnly: requiresLocal(normalized),
  };
}

export function recommend(models: ModelVariant[], category: CategoryId, options: { priority: Priority; localOnly: boolean; complexity: "routine" | "complex" }): Recommendation[] {
  const order: Tier[] = options.priority === "speed" ? ["everyday", "balanced", "deep"]
    : options.complexity === "complex" ? options.priority === "quality" ? ["deep", "balanced", "everyday"] : ["balanced", "everyday", "deep"]
    : options.priority === "quality" ? ["balanced", "everyday", "deep"] : ["everyday", "balanced", "deep"];
  const eligible = models.filter((model) => model.availability === "available" && (!options.localOnly || model.deployment === "local") && model.guidance[category]);
  const selected: ModelVariant[] = [];
  const seen = new Set<string>();
  const append = (model: ModelVariant) => {
    const key = `${model.provider}|${model.modelId}|${model.deployment}|${JSON.stringify(Object.entries(model.setting.parameters).sort(([a], [b]) => a.localeCompare(b)))}`;
    if (seen.has(key) || selected.some((item) => item.id === model.id)) return;
    seen.add(key); selected.push(model);
  };
  for (const tier of order) {
    const candidates = eligible.filter((model) => model.tier === tier);
    const candidate = candidates.find((model) => model.guidance[category]?.preferred) ?? candidates[0];
    if (candidate) append(candidate);
  }
  for (const model of eligible) { if (selected.length >= 3) break; append(model); }
  return selected.slice(0, 3).map((model, index) => ({ model, guidance: model.guidance[category]!, recommended: index === 0 }));
}
