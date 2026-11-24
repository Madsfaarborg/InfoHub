import type { Metadata } from "next";
import { TaskFinder } from "@/components/task-finder";
import { readCatalog } from "@/lib/repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Find a model" };
export default async function TasksPage() {
  const { bundle, warning } = await readCatalog();
  return <>{warning ? <p className="catalog-warning" role="status">{warning}</p> : null}<TaskFinder models={bundle.models} /><div className="task-page-note content-width"><p>You don’t need a perfect prompt. A sentence about the work is enough to find a starting point.</p></div></>;
}
