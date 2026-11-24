import Link from "next/link";
import { ArrowLeft } from "lucide-react";
export default function NotFound() {
  return <div className="not-found"><span className="eyebrow">A small detour</span><h1>This page isn’t in the guide.</h1><p>The model may have been retired, or the link may have changed.</p><Link className="button button-dark" href="/"><ArrowLeft size={16} />Back to InfoHub</Link></div>;
}
