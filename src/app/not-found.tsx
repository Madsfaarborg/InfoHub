import Link from "next/link";
import { ArrowLeft } from "lucide-react";
export default function NotFound() {
  return <div className="not-found"><span className="eyebrow">A small detour</span><h1>This page isn’t in the guide.</h1><p>The model may have been retired, or the link may have changed.</p><div className="recovery-actions"><Link className="button button-dark" href="/tasks"><ArrowLeft size={16} />Find a model</Link><Link className="text-button" href="/models">Browse models</Link></div></div>;
}
