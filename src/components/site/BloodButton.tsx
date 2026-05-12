import { Link } from "@tanstack/react-router";
import { useMemo, type ReactNode } from "react";

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

  // Posiciones aleatorias estables para los goteos de sangre.
  const drips = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        left: `${10 + i * 14 + Math.random() * 6}%`,
        height: `${20 + Math.random() * 40}px`,
        delay: `${Math.random() * 0.4}s`,
      })),
    [],
  );

  const inner = (
    <>
      <span className="label">{text}</span>
      <span className="drips" aria-hidden>
        {drips.map((d, i) => (
          <span
            key={i}
            className="drip"
            style={{ left: d.left, height: d.height, animationDelay: d.delay }}
          />
        ))}
      </span>
    </>
  );

  const cls = `blood-btn ${className}`;
  if ("to" in props && props.to) return <Link to={props.to} className={cls}>{inner}</Link>;
  if ("href" in props && props.href)
    return <a href={props.href} className={cls}>{inner}</a>;
  return <button onClick={(props as { onClick: () => void }).onClick} className={cls}>{inner}</button>;
}
