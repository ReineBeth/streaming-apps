import Link, { type LinkProps } from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "./ui.module.css";

type Variant = "primary" | "secondary";

function classNames(...names: Array<string | undefined>) {
  return names.filter(Boolean).join(" ");
}

export function Button({ variant = "primary", className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={classNames(styles.button, styles[variant], className)} {...props}>{children}</button>;
}

export function LinkButton({ variant = "primary", className, children, ...props }: LinkProps & { variant?: Variant; className?: string; children: ReactNode }) {
  return <Link className={classNames(styles.button, styles[variant], className)} {...props}>{children}</Link>;
}

export function TextLink({ className, children, ...props }: LinkProps & { className?: string; children: ReactNode }) {
  return <Link className={classNames(styles.link, className)} {...props}>{children}</Link>;
}
