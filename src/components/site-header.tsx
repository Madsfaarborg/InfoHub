"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { usePresence } from "./motion";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const panel = usePresence<HTMLElement>(open);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    const resize = () => { setMobile(media.matches); if (!media.matches) setOpen(false); };
    resize(); media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); button.current?.focus(); }
    };
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("keydown", key); document.removeEventListener("pointerdown", outside); };
  }, [open]);
  useLayoutEffect(() => {
    const nav = panel.ref.current;
    if (!nav) return;
    const measure = () => {
      const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
      nav.style.setProperty("--marker-x", active ? active.offsetLeft + active.offsetWidth / 2 - 2 + "px" : "0px");
      nav.dataset.active = String(!!active);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [pathname, mobile, panel.ref]);
  const links = [
    { href: "/tasks", label: "Find a model" },
    { href: "/models", label: "Models" },
    { href: "/frontier-personalities", label: "Frontier Personalities" },
    { href: "/compare", label: "Compare" },
    { href: "/news", label: "News" },
  ];
  return <header ref={header} className="site-header">
    <div className="header-inner">
      <Link href="/" className="wordmark" aria-label="InfoHub home" onClick={() => setOpen(false)}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor"/><rect x="15" y="3" width="8" height="8" rx="2" fill="currentColor"/><rect x="3" y="15" width="8" height="8" rx="2" fill="currentColor"/><rect x="15" y="15" width="8" height="8" rx="2" fill="#D93920"/></svg>
        InfoHub<span className="wordmark-dot">.</span>
      </Link>
      <nav ref={panel.ref} id="main-navigation" className={panel.present ? "main-nav is-open" : "main-nav"} aria-hidden={mobile && !open ? true : undefined} inert={mobile && !open} data-closing={mobile && !open} aria-label="Main navigation" onBlur={event => { if (mobile && !event.currentTarget.contains(event.relatedTarget as Node) && event.relatedTarget !== button.current) setOpen(false); }}>
        <span className="nav-marker" aria-hidden="true" />
        {links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={pathname.startsWith(link.href) ? "page" : undefined}>{link.label}</Link>)}
      </nav>
      <Link className="header-about" href="/about">How we choose <ArrowUpRight size={14} aria-hidden="true" /></Link>
      <button ref={button} aria-controls="main-navigation" className="menu-toggle icon-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Close navigation" : "Open navigation"}>{open ? <X size={22} /> : <Menu size={22} />}</button>
    </div>
  </header>;
}

