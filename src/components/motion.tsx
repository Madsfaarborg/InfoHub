"use client";

import { useEffect, useLayoutEffect, useRef, useState, type DependencyList, type ReactNode } from "react";

const running = new Set<Animation>();
const ease = "cubic-bezier(.22, 1, .36, 1)";

export function motionAllowed() {
  return typeof window !== "undefined" && document.documentElement.dataset.input !== "keyboard"
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function animate(element: Element, frames: Keyframe[], duration: number) {
  if (!motionAllowed() || !element.animate) return null;
  const animation = element.animate(frames, { duration, easing: ease });
  running.add(animation);
  animation.finished.then(() => running.delete(animation), () => running.delete(animation));
  return animation;
}

export function MotionPreferences() {
  useEffect(() => {
    const cancel = () => { running.forEach(animation => animation.cancel()); running.clear(); };
    const pointer = () => { document.documentElement.dataset.input = "pointer"; };
    const keyboard = () => { document.documentElement.dataset.input = "keyboard"; cancel(); };
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => { if (preference.matches) cancel(); };
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("keydown", keyboard, true);
    preference.addEventListener("change", change);
    return () => {
      cancel();
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("keydown", keyboard, true);
      preference.removeEventListener("change", change);
    };
  }, []);
  return null;
}

// State and accessibility update synchronously; effects only decorate the new result.
export function useReveal<T extends HTMLElement>(dependencies: DependencyList) {
  const ref = useRef<T>(null);
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) { first.current = false; return; }
    const animation = ref.current ? animate(ref.current, [{ opacity: .65 }, { opacity: 1 }], 160) : null;
    return () => animation?.cancel();
  }, dependencies);
  return ref;
}

export function Reveal({ children, change }: { children: ReactNode; change: string }) {
  const ref = useReveal<HTMLDivElement>([change]);
  return <div ref={ref}>{children}</div>;
}

export function usePresence<T extends HTMLElement>(open: boolean) {
  const ref = useRef<T>(null);
  const [present, setPresent] = useState(open);
  if (open && !present) setPresent(true);
  useLayoutEffect(() => {
    if (!present || !ref.current) return;
    const element = ref.current;
    const end = () => { if (!open) setPresent(false); };
    const upward = element.dataset.side === "top";
    const hidden = { opacity: 0, transform: `translateY(${upward ? 4 : -4}px) scale(.98)` };
    const visible = { opacity: 1, transform: "translateY(0) scale(1)" };
    const animation = animate(element, open ? [hidden, visible] : [visible, hidden], open ? 200 : 120);
    if (!animation) { end(); return; }
    // Cancellation (including a preference change) must also finish dismissal.
    let active = true;
    animation.finished.then(() => { if (active) end(); }, () => { if (active) end(); });
    return () => { active = false; animation.cancel(); };
  }, [open, present]);
  return { ref, present };
}

export function useFirstResult(showResults: boolean) {
  const hero = useRef<HTMLElement>(null);
  const previous = useRef<{ element: HTMLElement; top: number; left: number }[]>([]);
  function capture() {
    if (showResults || !motionAllowed() || window.innerWidth < 701) return;
    previous.current = Array.from(hero.current?.children ?? []).filter((element): element is HTMLElement => element instanceof HTMLElement).map(element => {
      const rect = element.getBoundingClientRect();
      return { element, top: rect.top, left: rect.left };
    });
  }
  useLayoutEffect(() => {
    const animations = previous.current.map(({ element, top, left }) => {
      const rect = element.getBoundingClientRect();
      return animate(element, [{ transform: `translate(${left - rect.left}px, ${top - rect.top}px)` }, { transform: "translate(0, 0)" }], 260);
    });
    previous.current = [];
    return () => animations.forEach(animation => animation?.cancel());
  }, [showResults]);
  return { hero, capture };
}
