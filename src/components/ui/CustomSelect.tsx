'use client';

import { useState, useRef, useEffect } from 'react';
import s from './CustomSelect.module.css';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  divider?: boolean;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
}

export default function CustomSelect({ value, onChange, options }: Props) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const selected = options.find((o) => !o.disabled && !o.divider && o.value === value);

  return (
    <div ref={ref} className={s.selectWrap}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={s.selectBtn}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`${s.selectBtnText} ${!selected ? s.selectBtnTextPlaceholder : ''}`}>
          {selected ? selected.label : '— none —'}
        </span>
        <svg
          viewBox="0 0 10 6" width="10" height="10" fill="none"
          stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}
          aria-hidden="true"
        >
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className={s.selectDropdown} role="listbox">
          {options.map((opt, i) => {
            if (opt.divider) {
              return (
                <div
                  key={i}
                  className={`${s.selectDivider} ${i > 0 ? s.selectDividerBordered : ''}`}
                >
                  {opt.label}
                </div>
              );
            }
            const isSelected = opt.value === value;
            const isHovered = hovered === `${i}`;
            return (
              <button
                key={i}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHovered(`${i}`)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`${s.selectOption} ${isHovered ? s.selectOptionHovered : ''} ${isSelected ? s.selectOptionSelected : ''}`}
              >
                {opt.label}
                {isSelected && (
                  <svg viewBox="0 0 12 10" width="12" height="10" fill="none" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 5l3.5 3.5L11 1" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
