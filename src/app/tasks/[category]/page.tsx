import { notFound } from "next/navigation";
import { TaskFinder } from "@/components/task-finder";
import { readCatalog } from "@/lib/repository";
import { categoryIds, type CategoryId } from "@/lib/types";

export const dynamic = "force-dynamic";
export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!categoryIds.includes(category as CategoryId)) notFound();
  const { bundle, warning } = await readCatalog();
  return <>{warning ? <p className="catalog-warning" role="status">{warning}</p> : null}<TaskFinder models={bundle.models} initialCategory={category as CategoryId} /></>;
}
