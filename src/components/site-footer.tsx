import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  return <footer className="site-footer"><div className="footer-inner">
    <Link className="footer-brand" href="/">InfoHub.</Link>
    <Link href="/about">How we choose <ArrowUpRight size={14} aria-hidden="true" /></Link>
  </div></footer>;
}
