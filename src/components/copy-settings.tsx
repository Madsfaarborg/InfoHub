"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { ModelVariant } from "@/lib/types";

export function CopySettings({ model }: { model: ModelVariant }) {
  const [state, setState] = useState<"ready" | "copied" | "error">("ready");
  const reset = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(reset.current), []);
  async function copy() {
    clearTimeout(reset.current);
    try {
      await navigator.clipboard.writeText([
        "Model: " + model.modelId,
        "Provider: " + model.provider,
        "Setting: " + model.setting.label,
        ...Object.entries(model.setting.parameters).map(([key, value]) => key + ": " + String(value)),
        model.setting.note,
        ...(model.image ? ["", "Example brief:", model.image.brief] : []),
      ].join("\n"));
      setState("copied");
      reset.current = setTimeout(() => setState("ready"), 2500);
    } catch { setState("error"); }
  }
  return <div className="copy-control"><button className="text-button" onClick={copy}><span className="copy-icon" data-copied={state === "copied"}><Copy size={15} aria-hidden="true" /><Check size={15} aria-hidden="true" /></span>{state === "copied" ? "Settings copied" : "Copy setup"}</button>
    <span className="sr-only" role="status">{state === "copied" ? "Model setup copied to clipboard" : ""}</span>
    {state === "error" ? <span className="copy-error" role="status">Clipboard unavailable. Settings are listed in the model details.</span> : null}
  </div>;
}

