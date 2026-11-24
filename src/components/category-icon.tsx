import { Code2, Bug, Network, ShieldCheck, ScanSearch, PenLine, ImageIcon, Megaphone, Presentation, ChartColumn } from "lucide-react";
import type { CategoryId } from "@/lib/types";

const icons = { images: ImageIcon, marketing: Megaphone, presentations: Presentation, analysis: ChartColumn, coding: Code2, debugging: Bug, networking: Network, security: ShieldCheck, research: ScanSearch, writing: PenLine };
export function CategoryIcon({ category, size = 18 }: { category: CategoryId; size?: number }) {
  const Icon = icons[category];
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}
