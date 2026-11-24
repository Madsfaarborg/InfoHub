"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = [{ href: "/tasks", label: "Find a model" }, { href: "/models", label: "Models" }, { href: "/compare", label: "Compare" }, { href: "/news", label: "News" }];
  return <header className="site-header">
    <div className="header-inner">
      <Link href="/" className="wordmark" aria-label="InfoHub home" onClick={() => setOpen(false)}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor"/><rect x="15" y="3" width="8" height="8" rx="2" fill="currentColor"/><rect x="3" y="15" width="8" height="8" rx="2" fill="currentColor"/><rect x="15" y="15" width="8" height="8" rx="2" fill="#D93920"/></svg>
        InfoHub<span className="wordmark-dot">.</span>
      </Link>
      <nav className={open ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
        {links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={pathname.startsWith(link.href) ? "page" : undefined}>{link.label}</Link>)}
      </nav>
      <Link className="header-about" href="/about">How we choose <ArrowUpRight size={14} aria-hidden="true" /></Link>
      <button className="menu-toggle icon-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Close navigation" : "Open navigation"}>{open ? <X size={22} /> : <Menu size={22} />}</button>
    </div>
  </header>;
}
