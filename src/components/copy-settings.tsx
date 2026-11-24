"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { ModelVariant } from "@/lib/types";

export function CopySettings({ model }: { model: ModelVariant }) {
  const [state, setState] = useState<"ready" | "copied" | "error">("ready");
  async function copy() {
    try {
      await navigator.clipboard.writeText([
        "Model: " + model.modelId,
        "Provider: " + model.provider,
        "Setting: " + model.setting.label,
        ...Object.entries(model.setting.parameters).map(([key, value]) => key + ": " + String(value)),
        model.setting.note,
      ].join("\n"));
      setState("copied");
    } catch { setState("error"); }
  }
  return <div className="copy-control"><button className="text-button" onClick={copy}>{state === "copied" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{state === "copied" ? "Settings copied" : "Copy setup"}</button>
    <span className="sr-only" role="status">{state === "copied" ? "Model setup copied to clipboard" : ""}</span>
    {state === "error" ? <span className="copy-error" role="status">Clipboard unavailable. Settings are listed in the model details.</span> : null}
  </div>;
}
