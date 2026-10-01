import type { ButtonHTMLAttributes, Ref } from "react";

/* The dashboard's shared button. Primary is the single amber action a
   section is allowed. Pages use this component rather than creating
   their own button variants. */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "text";
  busy?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export default function Button({
  variant = "primary",
  busy = false,
  children,
  className,
  ...rest
}: ButtonProps) {
  const classes = ["btn", `btn-${variant}`, className].filter(Boolean).join(" ");
  return (
    <button type="button" className={classes} aria-busy={busy || undefined} {...rest}>
      {busy && <span className="btn-spinner" aria-hidden="true" />}
      <span className="btn-label">{children}</span>
    </button>
  );
}
