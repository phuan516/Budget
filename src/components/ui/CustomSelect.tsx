'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId();
  const listboxId = `${uid}-listbox`;

  const selectableIndices = options.reduce<number[]>((acc, opt, i) => {
    if (!opt.divider && !opt.disabled) acc.push(i);
    return acc;
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) setActiveIndex(-1);
  }, [open]);

  function openDropdown() {
    const selectedIdx = options.findIndex((o) => !o.divider && !o.disabled && o.value === value);
    setActiveIndex(selectedIdx >= 0 ? selectedIdx : (selectableIndices[0] ?? -1));
    setOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    const currentPos = selectableIndices.indexOf(activeIndex);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = currentPos < selectableIndices.length - 1
          ? selectableIndices[currentPos + 1]
          : selectableIndices[0];
        setActiveIndex(next ?? -1);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = currentPos > 0
          ? selectableIndices[currentPos - 1]
          : selectableIndices[selectableIndices.length - 1];
        setActiveIndex(prev ?? -1);
        break;
      }
      case 'Home': {
        e.preventDefault();
        setActiveIndex(selectableIndices[0] ?? -1);
        break;
      }
      case 'End': {
        e.preventDefault();
        setActiveIndex(selectableIndices[selectableIndices.length - 1] ?? -1);
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const opt = options[activeIndex];
        if (opt && !opt.divider && !opt.disabled) {
          onChange(opt.value);
          setOpen(false);
        }
        break;
      }
      case 'Escape':
      case 'Tab': {
        setOpen(false);
        break;
      }
    }
  }

  const selected = options.find((o) => !o.disabled && !o.divider && o.value === value);
  const activeOptionId = activeIndex >= 0 ? `${uid}-opt-${activeIndex}` : undefined;

  return (
    <div ref={ref} className={s.selectWrap} style={open ? { zIndex: 10 } : undefined}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        onKeyDown={handleKeyDown}
        className={s.selectBtn}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open ? activeOptionId : undefined}
      >
        <span className={`${s.selectBtnText} ${!selected ? s.selectBtnTextPlaceholder : ''}`}>
          {selected ? selected.label : '— none —'}
        </span>
        <svg
          viewBox="0 0 10 6" width="10" height="10" fill="none"
          stroke="var(--color-ink-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: `transform var(--duration-base)`, transform: open ? 'rotate(180deg)' : 'none' }}
          aria-hidden="true"
        >
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listboxId}
            className={s.selectDropdown}
            role="listbox"
            aria-label="Options"
            initial={{ y: -4 }}
            animate={{ y: 0 }}
            exit={{ y: -4 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            {options.map((opt, i) => {
              if (opt.divider) {
                return (
                  <li
                    key={i}
                    role="presentation"
                    className={`${s.selectDivider} ${i > 0 ? s.selectDividerBordered : ''}`}
                  >
                    {opt.label}
                  </li>
                );
              }
              const isSelected = opt.value === value;
              const isActive = i === activeIndex;
              return (
                <li
                  key={i}
                  id={`${uid}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`${s.selectOption} ${isActive ? s.selectOptionHovered : ''} ${isSelected ? s.selectOptionSelected : ''}`}
                >
                  {opt.label}
                  {isSelected && (
                    <svg viewBox="0 0 12 10" width="12" height="10" fill="none" stroke="var(--color-ink-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 5l3.5 3.5L11 1" />
                    </svg>
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
