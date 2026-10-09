'use client';
// Petits composants d'interface : icône Hugeicons, bouton à menu déroulant, élément de menu.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';

export function Icon({ icon, size = 18, className }: { icon: IconSvgElement; size?: number; className?: string }) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.5} className={`ico ${className ?? ''}`} />;
}

// Bouton qui ouvre un menu ; `children` reçoit la fonction de fermeture.
export function MenuButton({
  label,
  icon,
  title,
  active = false,
  caret = true,
  align = 'left',
  className = '',
  wide = false,
  children,
}: {
  label?: ReactNode;
  icon?: IconSvgElement;
  title?: string;
  active?: boolean;
  caret?: boolean;
  align?: 'left' | 'right';
  className?: string;
  wide?: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open]);
  return (
    <div className="menu-wrap" ref={ref}>
      <button type="button" className={`tb-btn${active || open ? ' on' : ''}${!label && !caret ? ' icon' : ''} ${className}`} title={title} onClick={() => setOpen(!open)}>
        {icon && <Icon icon={icon} />}
        {label && <span>{label}</span>}
        {caret && <Icon icon={ArrowDown01Icon} size={14} className="caret" />}
      </button>
      {open && <div className={`popover ${align}${wide ? ' wide' : ''}`}>{children(() => setOpen(false))}</div>}
    </div>
  );
}

export function MenuItem({
  label,
  sub,
  icon,
  on = false,
  hint,
  onClick,
}: {
  label: ReactNode;
  sub?: string;
  icon?: IconSvgElement;
  on?: boolean;
  hint?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`pop-item${on ? ' on' : ''}${sub ? ' two-line' : ''}`} onClick={onClick}>
      {icon && <Icon icon={icon} size={16} />}
      <span>
        {label}
        {sub && <small>{sub}</small>}
      </span>
      {hint}
    </button>
  );
}

export const Switch = () => <span className="switch" />;
