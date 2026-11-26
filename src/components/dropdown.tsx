"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

type Option = { value: string; label: string };
type DropdownProps = {
  id?: string;
  name?: string;
  label: string;
  options: Option[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

export function Dropdown({ id, name, label, options, value, defaultValue, onChange }: DropdownProps) {
  const generatedId = useId();
  const listId = generatedId + "-list";
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef({ text: "", time: 0 });
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value ?? "");
  const selectedValue = value ?? internalValue;
  const selectedIndex = Math.max(0, options.findIndex(option => option.value === selectedValue));
  const [active, setActive] = useState(selectedIndex);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(listId + "-" + active)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    if (value === undefined) setInternalValue(option.value);
    onChange?.(option.value);
    setOpen(false);
    trigger.current?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const key = event.key;
    if (key === "Tab") { setOpen(false); return; }
    if (key === "Escape" && open) { event.preventDefault(); setOpen(false); return; }
    if (key === "ArrowDown" || key === "ArrowUp" || key === "Home" || key === "End") {
      event.preventDefault();
      if (!open) {
        setActive(key === "Home" ? 0 : key === "End" ? options.length - 1 : selectedIndex);
        setOpen(true);
      } else {
        setActive(current => key === "Home" ? 0 : key === "End" ? options.length - 1 : Math.max(0, Math.min(options.length - 1, current + (key === "ArrowDown" ? 1 : -1))));
      }
      return;
    }
    if ((key === "Enter" || key === " ") && open) {
      event.preventDefault();
      choose(active);
      return;
    }
    if (key.length === 1 && key !== " " && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      const query = (now - search.current.time < 700 ? search.current.text : "") + key.toLocaleLowerCase();
      search.current = { text: query, time: now };
      const index = options.findIndex(option => option.label.toLocaleLowerCase().startsWith(query));
      if (index >= 0) { setActive(index); setOpen(true); }
    }
  }

  return <div className="dropdown" ref={root} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }}>
    {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
    <button ref={trigger} id={id} type="button" className="dropdown-trigger" role="combobox"
      aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId}
      aria-activedescendant={open ? listId + "-" + active : undefined}
      onKeyDown={onKeyDown} onClick={() => { setActive(selectedIndex); setOpen(current => !current); }}>
      <span>{options[selectedIndex]?.label ?? ""}</span><ChevronDown size={16} aria-hidden="true" />
    </button>
    {open ? <div id={listId} role="listbox" aria-label={label} className="dropdown-menu">
      {options.map((option, index) => <div key={option.value} id={listId + "-" + index}
        role="option" aria-selected={option.value === selectedValue}
        className={"dropdown-option" + (active === index ? " is-active" : "")}
        onMouseMove={() => setActive(index)} onPointerDown={event => { if (event.pointerType === "mouse") event.preventDefault(); }} onClick={() => choose(index)}>
        <span>{option.label}</span>{option.value === selectedValue ? <Check size={16} aria-hidden="true" /> : null}
      </div>)}
    </div> : null}
  </div>;
}
