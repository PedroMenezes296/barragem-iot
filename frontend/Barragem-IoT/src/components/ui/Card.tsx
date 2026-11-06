import type { ComponentPropsWithoutRef } from "react";

type CardProps = ComponentPropsWithoutRef<"section">;

export default function Card({ className = "", children, ...props }: CardProps) {
  return <section className={`card${className ? ` ${className}` : ""}`} {...props}>{children}</section>;
}
