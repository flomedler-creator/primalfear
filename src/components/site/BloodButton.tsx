import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";

interface BaseProps {
  children: ReactNode;
  className?: string;
}
type Props =
  | (BaseProps & { to: string; href?: never; onClick?: never })
  | (BaseProps & { href: string; to?: never; onClick?: never })
  | (BaseProps & { onClick: () => void; to?: never; href?: never });

/** Botón con fondo que se oscurece y letras que sangran al pasar el cursor. */
export function BloodButton(props: Props) {
  const { children, className = "" } = props;
  const text = String(children);

  const inner = (
    <>
      <span className="corner corner-tl" aria-hidden />
      <span className="corner corner-tr" aria-hidden />
      <span className="corner corner-bl" aria-hidden />
      <span className="corner corner-br" aria-hidden />
      <span className="label">{text}</span>
    </>
  );

  const cls = `blood-btn ${className}`;
  if ("to" in props && props.to) return <Link to={props.to} className={cls}>{inner}</Link>;
  if ("href" in props && props.href)
    return <a href={props.href} className={cls}>{inner}</a>;
  return <button onClick={(props as { onClick: () => void }).onClick} className={cls}>{inner}</button>;
}
