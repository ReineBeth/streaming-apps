"use client";

import { createContext, useContext, useId, useMemo, useState, type ReactNode } from "react";

import styles from "./accordion.module.css";

type AccordionValue = string | string[] | null;

interface AccordionProps {
  children: ReactNode;
  className?: string;
  defaultValue?: AccordionValue;
  value?: AccordionValue;
  multiple?: boolean;
  onChange?: (value: AccordionValue) => void;
}

interface AccordionContextValue {
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
}

interface AccordionItemContextValue {
  value: string;
  panelId: string;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);
const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

function normalizeValues(value: AccordionValue): string[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function AccordionRoot({ children, className, defaultValue = null, value, multiple = false, onChange }: AccordionProps) {
  const [internalValue, setInternalValue] = useState<AccordionValue>(defaultValue);
  const currentValue = value === undefined ? internalValue : value;
  const openValues = useMemo(() => new Set(normalizeValues(currentValue)), [currentValue]);

  function toggle(itemValue: string) {
    const nextValues = new Set(openValues);
    if (nextValues.has(itemValue)) {
      nextValues.delete(itemValue);
    } else if (multiple) {
      nextValues.add(itemValue);
    } else {
      nextValues.clear();
      nextValues.add(itemValue);
    }

    const nextValue: AccordionValue = multiple ? [...nextValues] : nextValues.values().next().value ?? null;
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
  }

  const contextValue = { isOpen: (itemValue: string) => openValues.has(itemValue), toggle };

  return <div className={`${styles.accordion} ${className ?? ""}`}><AccordionContext.Provider value={contextValue}>{children}</AccordionContext.Provider></div>;
}

function AccordionItem({ value, children }: { value: string; children: ReactNode }) {
  const panelId = useId();
  return <AccordionItemContext.Provider value={{ value, panelId }}><section className={styles.item}>{children}</section></AccordionItemContext.Provider>;
}

function AccordionControl({ children }: { children: ReactNode }) {
  const accordion = useContext(AccordionContext);
  const item = useContext(AccordionItemContext);
  if (!accordion || !item) throw new Error("Accordion.Control must be rendered inside Accordion.Item");

  const open = accordion.isOpen(item.value);
  return <h2 className={styles.heading}><button className={styles.control} type="button" aria-expanded={open} aria-controls={item.panelId} onClick={() => accordion.toggle(item.value)}><span>{children}</span><span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} aria-hidden="true"><span className={styles.chevronIcon} /></span></button></h2>;
}

function AccordionPanel({ children }: { children: ReactNode }) {
  const accordion = useContext(AccordionContext);
  const item = useContext(AccordionItemContext);
  if (!accordion || !item) throw new Error("Accordion.Panel must be rendered inside Accordion.Item");

  return <div id={item.panelId} className={styles.panel} hidden={!accordion.isOpen(item.value)}>{children}</div>;
}

export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Control: AccordionControl,
  Panel: AccordionPanel,
});
