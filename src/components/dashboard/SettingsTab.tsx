'use client';

import { useState } from 'react';
import { Config } from '@/lib/store/useStore';
import s from './SettingsTab.module.css';

const MONO = 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)';

interface Props {
  config: Config;
  isLoading: boolean;
  onAdd: (type: string, name: string, value?: string, extra?: string) => Promise<void>;
  onDelete: (type: string, id: string) => Promise<void>;
  onEdit: (type: string, id: string, name: string, value?: string, extra?: string) => Promise<void>;
  onSetIncome: (amount: number) => Promise<void>;
}

function PencilBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className={s.pencilBtn} title="Edit">
      <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5z" />
      </svg>
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className={s.sectionTitle}>{children}</div>;
}

function AddButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${s.btnPrimary} ${disabled ? s.btnPrimaryDisabled : ''}`}
    >
      {disabled ? '…' : 'Add'}
    </button>
  );
}

function DeleteBtn({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} className={s.deleteBtn} title="Remove">
      {loading ? '…' : '×'}
    </button>
  );
}

function NameListSection({
  title, items, type, onAdd, onDelete, onEdit,
}: {
  title: string;
  items: { id: string; name: string }[];
  type: string;
  onAdd: (type: string, name: string) => Promise<void>;
  onDelete: (type: string, id: string) => Promise<void>;
  onEdit: (type: string, id: string, name: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!draft.trim()) return;
    const name = draft.trim();
    setDraft('');
    setAdding(true);
    try { await onAdd(type, name); }
    finally { setAdding(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try { await onDelete(type, id); }
    finally { setDeletingId(null); }
  }

  function startEdit(item: { id: string; name: string }) {
    setEditingId(item.id);
    setEditDraft(item.name);
  }

  async function saveEdit(id: string) {
    if (!editDraft.trim()) return;
    setSaving(true);
    try { await onEdit(type, id, editDraft.trim()); setEditingId(null); }
    finally { setSaving(false); }
  }

  return (
    <section className={s.section}>
      <SectionTitle>{title}</SectionTitle>
      {items.length > 0 && (
        <div className={s.itemList}>
          {items.map((item) => (
            <div key={item.id} className={s.item}>
              {editingId === item.id ? (
                <>
                  <input
                    autoFocus
                    type="text"
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(item.id); if (e.key === 'Escape') setEditingId(null); }}
                    className={s.input}
                    style={{ padding: '5px 9px' }}
                  />
                  <button
                    onClick={() => saveEdit(item.id)}
                    disabled={saving || !editDraft.trim()}
                    className={`${s.btnPrimary} ${s.btnPrimarySmall} ${(saving || !editDraft.trim()) ? s.btnPrimaryDisabled : ''}`}
                  >
                    {saving ? '…' : 'Save'}
                  </button>
                  <button onClick={() => setEditingId(null)} className={s.btnGhost}>Cancel</button>
                </>
              ) : (
                <>
                  <span className={s.itemName}>{item.name}</span>
                  <PencilBtn onClick={() => startEdit(item)} />
                  <DeleteBtn onClick={() => handleDelete(item.id)} loading={deletingId === item.id} />
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && <div className={s.emptyNote}>None yet</div>}
      <div className={s.addRow}>
        <input
          type="text"
          placeholder={`New ${title.toLowerCase().replace(/s$/, '')}…`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          className={s.input}
        />
        <AddButton onClick={handleAdd} disabled={adding || !draft.trim()} />
      </div>
    </section>
  );
}

function FixedExpenseSection({
  items, monthlyIncome, onAdd, onDelete, onEdit,
}: {
  items: { id: string; name: string; amount: number }[];
  monthlyIncome: number;
  onAdd: (type: string, name: string, value: string) => Promise<void>;
  onDelete: (type: string, id: string) => Promise<void>;
  onEdit: (type: string, id: string, name: string, value: string) => Promise<void>;
}) {
  const [draftName, setDraftName] = useState('');
  const [draftAmount, setDraftAmount] = useState('');
  const [draftPct, setDraftPct] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editPct, setEditPct] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  function handleAmountChange(val: string, setAmt: (v: string) => void, setPct: (v: string) => void) {
    setAmt(val);
    if (monthlyIncome > 0 && val !== '') {
      const amt = parseFloat(val);
      if (!isNaN(amt)) setPct(((amt / monthlyIncome) * 100).toFixed(1));
      else setPct('');
    } else setPct('');
  }

  function handlePctChange(val: string, setAmt: (v: string) => void, setPct: (v: string) => void) {
    setPct(val);
    if (monthlyIncome > 0 && val !== '') {
      const pct = parseFloat(val);
      if (!isNaN(pct)) setAmt(((pct / 100) * monthlyIncome).toFixed(2));
      else setAmt('');
    } else setAmt('');
  }

  async function handleAdd() {
    if (!draftName.trim() || !draftAmount) return;
    const name = draftName.trim();
    const amount = draftAmount;
    setDraftName(''); setDraftAmount(''); setDraftPct('');
    setAdding(true);
    try { await onAdd('fixed_expense', name, amount); }
    finally { setAdding(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try { await onDelete('fixed_expense', id); }
    finally { setDeletingId(null); }
  }

  function startEdit(item: { id: string; name: string; amount: number }) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditAmount(String(item.amount));
    setEditPct(monthlyIncome > 0 ? ((item.amount / monthlyIncome) * 100).toFixed(1) : '');
  }

  async function saveEdit(id: string) {
    if (!editName.trim() || !editAmount) return;
    setEditSaving(true);
    try { await onEdit('fixed_expense', id, editName.trim(), editAmount); setEditingId(null); }
    finally { setEditSaving(false); }
  }

  const fmtAmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
  const toPct = (amt: number) => monthlyIncome > 0 ? ((amt / monthlyIncome) * 100).toFixed(1) + '%' : null;

  return (
    <section className={s.section}>
      <SectionTitle>Monthly Expenses</SectionTitle>
      {items.length > 0 && (
        <div className={s.itemList}>
          {items.map((item) => (
            <div key={item.id} className={s.fixedItem}>
              {editingId === item.id ? (
                <div className={s.fixedEditRow}>
                  <input autoFocus type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null); }}
                    className={s.input} style={{ flex: 2, padding: '5px 9px' }} placeholder="Name…" />
                  <div className={s.symbolWrap}>
                    <span className={s.symbolPrefix}>$</span>
                    <input type="number" min="0" step="0.01" value={editAmount}
                      onChange={(e) => handleAmountChange(e.target.value, setEditAmount, setEditPct)}
                      className={`${s.input} ${s.inputMono}`}
                      style={{ paddingLeft: 22, width: '100%', boxSizing: 'border-box', padding: '5px 9px 5px 22px' }} />
                  </div>
                  <div className={s.symbolWrap}>
                    <input type="number" min="0" step="0.1" value={editPct}
                      onChange={(e) => handlePctChange(e.target.value, setEditAmount, setEditPct)}
                      className={`${s.input} ${s.inputMono}`}
                      style={{ paddingRight: 26, width: '100%', boxSizing: 'border-box', padding: '5px 26px 5px 9px' }} />
                    <span className={s.symbolSuffix}>%</span>
                  </div>
                  <button onClick={() => saveEdit(item.id)} disabled={editSaving || !editName.trim() || !editAmount}
                    className={`${s.btnPrimary} ${s.btnPrimarySmall} ${(editSaving || !editName.trim() || !editAmount) ? s.btnPrimaryDisabled : ''}`}>
                    {editSaving ? '…' : 'Save'}
                  </button>
                  <button onClick={() => setEditingId(null)} className={s.btnGhost}>Cancel</button>
                </div>
              ) : (
                <div className={s.fixedViewRow}>
                  <span className={s.fixedViewName}>{item.name}</span>
                  <span className={s.fixedViewAmount}>{fmtAmt(item.amount)}</span>
                  {toPct(item.amount) && (
                    <span className={s.fixedViewPct}>· {toPct(item.amount)}</span>
                  )}
                  <PencilBtn onClick={() => startEdit(item)} />
                  <DeleteBtn onClick={() => handleDelete(item.id)} loading={deletingId === item.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && <div className={s.emptyNote}>None yet</div>}
      <div className={s.addRow}>
        <input
          type="text"
          placeholder="Name…"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          className={s.input}
          style={{ flex: 2 }}
        />
        <div className={s.symbolWrap}>
          <span className={s.symbolPrefix}>$</span>
          <input
            type="number"
            placeholder="Amount"
            min="0"
            step="0.01"
            value={draftAmount}
            onChange={(e) => handleAmountChange(e.target.value, setDraftAmount, setDraftPct)}
            className={`${s.input} ${s.inputMono}`}
            style={{ paddingLeft: 22, width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        <div className={s.symbolWrap}>
          <input
            type="number"
            placeholder="% of income"
            min="0"
            step="0.1"
            value={draftPct}
            onChange={(e) => handlePctChange(e.target.value, setDraftAmount, setDraftPct)}
            className={`${s.input} ${s.inputMono}`}
            style={{ paddingRight: 26, width: '100%', boxSizing: 'border-box' }}
          />
          <span className={s.symbolSuffix}>%</span>
        </div>
        <AddButton onClick={handleAdd} disabled={adding || !draftName.trim() || !draftAmount} />
      </div>
    </section>
  );
}

function SavingGoalSection({
  items, onAdd, onDelete, onEdit,
}: {
  items: { id: string; name: string; amount: number; initialAmount: number }[];
  onAdd: (type: string, name: string, value: string, extra: string) => Promise<void>;
  onDelete: (type: string, id: string) => Promise<void>;
  onEdit: (type: string, id: string, name: string, value: string, extra: string) => Promise<void>;
}) {
  const [draftName, setDraftName] = useState('');
  const [draftTarget, setDraftTarget] = useState('');
  const [draftInitial, setDraftInitial] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editInitial, setEditInitial] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const fmtAmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });

  async function handleAdd() {
    if (!draftName.trim() || !draftTarget) return;
    const name = draftName.trim();
    const target = draftTarget;
    const initial = draftInitial;
    setDraftName(''); setDraftTarget(''); setDraftInitial('');
    setAdding(true);
    try { await onAdd('saving_goal', name, target, initial); }
    finally { setAdding(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try { await onDelete('saving_goal', id); }
    finally { setDeletingId(null); }
  }

  function startEdit(item: { id: string; name: string; amount: number; initialAmount: number }) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditTarget(String(item.amount));
    setEditInitial(item.initialAmount > 0 ? String(item.initialAmount) : '');
  }

  async function saveEdit(id: string) {
    if (!editName.trim() || !editTarget) return;
    setEditSaving(true);
    try { await onEdit('saving_goal', id, editName.trim(), editTarget, editInitial); setEditingId(null); }
    finally { setEditSaving(false); }
  }

  return (
    <section className={s.section}>
      <SectionTitle>Saving Goals</SectionTitle>
      {items.length > 0 && (
        <div className={s.itemList}>
          {items.map((item) => (
            <div key={item.id} className={s.fixedItem}>
              {editingId === item.id ? (
                <div className={`${s.fixedEditRow} max-sm:flex-col`}>
                  <input autoFocus type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null); }}
                    className={s.input} style={{ flex: 2, padding: '5px 9px' }} placeholder="Name…" />
                  <input type="number" min="0" step="0.01" value={editTarget} onChange={(e) => setEditTarget(e.target.value)}
                    className={`${s.input} ${s.inputMono}`} style={{ flex: 1, padding: '5px 9px' }} placeholder="Target" />
                  <input type="number" min="0" step="0.01" value={editInitial} onChange={(e) => setEditInitial(e.target.value)}
                    className={`${s.input} ${s.inputMono}`} style={{ flex: 1, padding: '5px 9px' }} placeholder="Saved so far" />
                  <button onClick={() => saveEdit(item.id)} disabled={editSaving || !editName.trim() || !editTarget}
                    className={`${s.btnPrimary} ${s.btnPrimarySmall} ${(editSaving || !editName.trim() || !editTarget) ? s.btnPrimaryDisabled : ''}`}>
                    {editSaving ? '…' : 'Save'}
                  </button>
                  <button onClick={() => setEditingId(null)} className={s.btnGhost}>Cancel</button>
                </div>
              ) : (
                <div className={s.goalViewRow}>
                  <span className={s.goalViewName}>{item.name}</span>
                  <span className={s.goalViewMeta}>
                    target {fmtAmt(item.amount)}
                    {item.initialAmount > 0 && <> · saved {fmtAmt(item.initialAmount)}</>}
                  </span>
                  <PencilBtn onClick={() => startEdit(item)} />
                  <DeleteBtn onClick={() => handleDelete(item.id)} loading={deletingId === item.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && <div className={s.emptyNote}>None yet</div>}
      <div className={`${s.addRow} max-sm:flex-col`}>
        <input type="text" placeholder="Name…" value={draftName} onChange={(e) => setDraftName(e.target.value)} className={s.input} style={{ flex: 2 }} />
        <input type="number" placeholder="Target amount" min="0" step="0.01" value={draftTarget} onChange={(e) => setDraftTarget(e.target.value)} className={`${s.input} ${s.inputMono}`} style={{ flex: 1 }} />
        <input type="number" placeholder="Already saved" min="0" step="0.01" value={draftInitial} onChange={(e) => setDraftInitial(e.target.value)} className={`${s.input} ${s.inputMono}`} style={{ flex: 1 }} />
        <AddButton onClick={handleAdd} disabled={adding || !draftName.trim() || !draftTarget} />
      </div>
    </section>
  );
}

export default function SettingsTab({ config, isLoading, onAdd, onDelete, onEdit, onSetIncome }: Props) {
  const [incomeValue, setIncomeValue] = useState(config.monthlyIncome > 0 ? String(config.monthlyIncome) : '');
  const [savingIncome, setSavingIncome] = useState(false);
  const [incomeSaved, setIncomeSaved] = useState(false);

  async function handleSaveIncome() {
    const val = parseFloat(incomeValue);
    if (!val || val < 0) return;
    setSavingIncome(true);
    try {
      await onSetIncome(val);
      setIncomeSaved(true);
      setTimeout(() => setIncomeSaved(false), 2000);
    } finally {
      setSavingIncome(false);
    }
  }

  if (isLoading) {
    return (
      <div className={s.spinner}>
        <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const saveBtnBg = incomeSaved ? '#0F9D58' : (savingIncome || !incomeValue) ? '#d8d8d8' : '#1a1a1a';

  return (
    <div className={s.root}>
      <section className={s.section}>
        <SectionTitle>Monthly Income</SectionTitle>
        <div className={s.incomeRow}>
          <div className={s.incomeInputWrap}>
            <span className={s.incomePrefix}>$</span>
            <input
              type="number"
              placeholder="0"
              min="0"
              step="1"
              value={incomeValue}
              onChange={(e) => { setIncomeValue(e.target.value); setIncomeSaved(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveIncome(); }}
              className={`${s.input} ${s.inputMono}`}
              style={{ paddingLeft: 22, fontFamily: MONO, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={handleSaveIncome}
            disabled={savingIncome || !incomeValue}
            className={s.incomeSaveBtn}
            style={{ background: saveBtnBg, cursor: savingIncome || !incomeValue ? 'not-allowed' : 'pointer' }}
          >
            {savingIncome ? '…' : incomeSaved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      </section>

      <NameListSection
        title="Categories"
        items={config.categories}
        type="category"
        onAdd={onAdd}
        onDelete={onDelete}
        onEdit={onEdit}
      />

      <NameListSection
        title="Cards & Payment Methods"
        items={config.cards}
        type="card"
        onAdd={onAdd}
        onDelete={onDelete}
        onEdit={onEdit}
      />

      <FixedExpenseSection
        items={config.fixedExpenses}
        monthlyIncome={config.monthlyIncome}
        onAdd={onAdd}
        onDelete={onDelete}
        onEdit={onEdit}
      />

      <SavingGoalSection
        items={config.savingGoals}
        onAdd={onAdd}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </div>
  );
}
