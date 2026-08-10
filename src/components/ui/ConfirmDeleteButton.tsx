'use client';

import { useEffect, useRef, useState } from 'react';

interface ConfirmDeleteButtonProps {
  onDelete: () => void;
  className?: string;
  title?: string;
  ariaLabel: string;
  disabled?: boolean;
  children: React.ReactNode;
  armMs?: number;
}

// First click arms the button (red outline, "click again" tooltip); a second click
// within armMs actually deletes. Prevents an accidental single mis-tap from
// permanently destroying financial data with no undo path.
export default function ConfirmDeleteButton({
  onDelete,
  className,
  title,
  ariaLabel,
  disabled,
  children,
  armMs = 2500,
}: ConfirmDeleteButtonProps) {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function handleClick() {
    if (disabled) return;
    if (!armed) {
      setArmed(true);
      timerRef.current = setTimeout(() => setArmed(false), armMs);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setArmed(false);
    onDelete();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={className}
      title={armed ? 'Click again to confirm delete' : title}
      aria-label={armed ? `Confirm delete: ${ariaLabel}` : ariaLabel}
      style={armed ? {
        color: 'var(--color-danger-text)',
        boxShadow: '0 0 0 1.5px var(--color-danger-text)',
        borderRadius: 4,
      } : undefined}
    >
      {children}
    </button>
  );
}
