'use client';

import { useState } from 'react';
import { Config } from '@/lib/store/useStore';

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
    <button
      onClick={onClick}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: '0 4px', lineHeight: 1, display: 'flex', alignItems: 'center' }}
      title="Edit"
    >
      <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5z" />
      </svg>
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: '#888', marginBottom: 12 }}>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #d8d8d8',
  borderRadius: 8,
  padding: '8px 11px',
  fontSize: 13,
  color: '#1a1a1a',
  background: '#fff',
  outline: 'none',
  flex: 1,
  minWidth: 0,
};

function AddButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: 'none',
        background: disabled ? '#d8d8d8' : '#1a1a1a',
        color: '#fff',
        padding: '8px 14px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0,
      }}
    >
      {disabled ? '…' : 'Add'}
    </button>
  );
}

function DeleteBtn({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 16, padding: '0 4px', lineHeight: 1 }}
      title="Remove"
    >
      {loading ? '…' : '×'}
    </button>
  );
}

/* ─── name-only list section (categories, cards) ─────────────── */
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
    <section style={{ marginBottom: 36 }}>
      <SectionTitle>{title}</SectionTitle>
      {items.length > 0 && (
        <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f5', gap: 6 }}>
              {editingId === item.id ? (
                <>
                  <input
                    autoFocus
                    type="text"
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(item.id); if (e.key === 'Escape') setEditingId(null); }}
                    style={{ ...inputStyle, flex: 1, padding: '5px 9px' }}
                  />
                  <button onClick={() => saveEdit(item.id)} disabled={saving || !editDraft.trim()} style={{ border: 'none', background: '#1a1a1a', color: '#fff', padding: '5px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer' }}>
                    {saving ? '…' : 'Save'}
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ border: 'none', background: 'none', color: '#888', fontSize: 12, cursor: 'pointer', padding: '5px 8px' }}>Cancel</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 13, color: '#1a1a1a' }}>{item.name}</span>
                  <PencilBtn onClick={() => startEdit(item)} />
                  <DeleteBtn onClick={() => handleDelete(item.id)} loading={deletingId === item.id} />
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && (
        <div style={{ fontSize: 12, color: '#bbb', marginBottom: 10 }}>None yet</div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder={`New ${title.toLowerCase().replace(/s$/, '')}…`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          style={inputStyle}
        />
        <AddButton onClick={handleAdd} disabled={adding || !draft.trim()} />
      </div>
    </section>
  );
}

/* ─── fixed expenses (name + $ amount + % of income, linked) ──── */
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

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
  const toPct = (amt: number) => monthlyIncome > 0 ? ((amt / monthlyIncome) * 100).toFixed(1) + '%' : null;

  return (
    <section style={{ marginBottom: 36 }}>
      <SectionTitle>Monthly Expenses</SectionTitle>
      {items.length > 0 && (
        <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {items.map((item) => (
            <div key={item.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
              {editingId === item.id ? (
                <div style={{ display: 'flex', gap: 8, padding: '8px 0', alignItems: 'center' }} className="max-sm:flex-col">
                  <input autoFocus type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null); }}
                    style={{ ...inputStyle, flex: 2, padding: '5px 9px' }} placeholder="Name…" />
                  <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                    <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#888', pointerEvents: 'none' }}>$</span>
                    <input type="number" min="0" step="0.01" value={editAmount}
                      onChange={(e) => handleAmountChange(e.target.value, setEditAmount, setEditPct)}
                      style={{ ...inputStyle, paddingLeft: 22, fontFamily: MONO, width: '100%', boxSizing: 'border-box', padding: '5px 9px 5px 22px' }} />
                  </div>
                  <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                    <input type="number" min="0" step="0.1" value={editPct}
                      onChange={(e) => handlePctChange(e.target.value, setEditAmount, setEditPct)}
                      style={{ ...inputStyle, paddingRight: 26, fontFamily: MONO, width: '100%', boxSizing: 'border-box', padding: '5px 26px 5px 9px' }} />
                    <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#888', pointerEvents: 'none' }}>%</span>
                  </div>
                  <button onClick={() => saveEdit(item.id)} disabled={editSaving || !editName.trim() || !editAmount}
                    style={{ border: 'none', background: '#1a1a1a', color: '#fff', padding: '5px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                    {editSaving ? '…' : 'Save'}
                  </button>
                  <button onClick={() => setEditingId(null)}
                    style={{ border: 'none', background: 'none', color: '#888', fontSize: 12, cursor: 'pointer', padding: '5px 8px', flexShrink: 0 }}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0', gap: 6 }}>
                  <span style={{ flex: 1, fontSize: 13, color: '#1a1a1a' }}>{item.name}</span>
                  <span style={{ fontSize: 13, color: '#444', fontFamily: MONO }}>{fmt(item.amount)}</span>
                  {toPct(item.amount) && (
                    <span style={{ fontSize: 11, color: '#aaa', fontFamily: MONO }}>· {toPct(item.amount)}</span>
                  )}
                  <PencilBtn onClick={() => startEdit(item)} />
                  <DeleteBtn onClick={() => handleDelete(item.id)} loading={deletingId === item.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && (
        <div style={{ fontSize: 12, color: '#bbb', marginBottom: 10 }}>None yet</div>
      )}
      <div style={{ display: 'flex', gap: 8 }} className="max-sm:flex-col">
        <input
          type="text"
          placeholder="Name…"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          style={{ ...inputStyle, flex: 2 }}
        />
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#888', pointerEvents: 'none' }}>$</span>
          <input
            type="number"
            placeholder="Amount"
            min="0"
            step="0.01"
            value={draftAmount}
            onChange={(e) => handleAmountChange(e.target.value, setDraftAmount, setDraftPct)}
            style={{ ...inputStyle, paddingLeft: 22, fontFamily: MONO, width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <input
            type="number"
            placeholder="% of income"
            min="0"
            step="0.1"
            value={draftPct}
            onChange={(e) => handlePctChange(e.target.value, setDraftAmount, setDraftPct)}
            style={{ ...inputStyle, paddingRight: 26, fontFamily: MONO, width: '100%', boxSizing: 'border-box' }}
          />
          <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#888', pointerEvents: 'none' }}>%</span>
        </div>
        <AddButton onClick={handleAdd} disabled={adding || !draftName.trim() || !draftAmount} />
      </div>
    </section>
  );
}

/* ─── name + amount list section (saving goals) ──────────────── */
/* ─── saving goals (name + target + initial) ─────────────────── */
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

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });

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
    <section style={{ marginBottom: 36 }}>
      <SectionTitle>Saving Goals</SectionTitle>
      {items.length > 0 && (
        <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {items.map((item) => (
            <div key={item.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
              {editingId === item.id ? (
                <div style={{ display: 'flex', gap: 8, padding: '8px 0', alignItems: 'center' }} className="max-sm:flex-col">
                  <input autoFocus type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null); }}
                    style={{ ...inputStyle, flex: 2, padding: '5px 9px' }} placeholder="Name…" />
                  <input type="number" min="0" step="0.01" value={editTarget} onChange={(e) => setEditTarget(e.target.value)}
                    style={{ ...inputStyle, flex: 1, fontFamily: MONO, padding: '5px 9px' }} placeholder="Target" />
                  <input type="number" min="0" step="0.01" value={editInitial} onChange={(e) => setEditInitial(e.target.value)}
                    style={{ ...inputStyle, flex: 1, fontFamily: MONO, padding: '5px 9px' }} placeholder="Saved so far" />
                  <button onClick={() => saveEdit(item.id)} disabled={editSaving || !editName.trim() || !editTarget}
                    style={{ border: 'none', background: '#1a1a1a', color: '#fff', padding: '5px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                    {editSaving ? '…' : 'Save'}
                  </button>
                  <button onClick={() => setEditingId(null)}
                    style={{ border: 'none', background: 'none', color: '#888', fontSize: 12, cursor: 'pointer', padding: '5px 8px', flexShrink: 0 }}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0', gap: 6 }}>
                  <span style={{ flex: 1, fontSize: 13, color: '#1a1a1a' }}>{item.name}</span>
                  <span style={{ fontSize: 12, color: '#888', fontFamily: MONO }}>
                    target {fmt(item.amount)}
                    {item.initialAmount > 0 && <> · saved {fmt(item.initialAmount)}</>}
                  </span>
                  <PencilBtn onClick={() => startEdit(item)} />
                  <DeleteBtn onClick={() => handleDelete(item.id)} loading={deletingId === item.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && (
        <div style={{ fontSize: 12, color: '#bbb', marginBottom: 10 }}>None yet</div>
      )}
      <div style={{ display: 'flex', gap: 8 }} className="max-sm:flex-col">
        <input type="text" placeholder="Name…" value={draftName} onChange={(e) => setDraftName(e.target.value)} style={{ ...inputStyle, flex: 2 }} />
        <input type="number" placeholder="Target amount" min="0" step="0.01" value={draftTarget} onChange={(e) => setDraftTarget(e.target.value)} style={{ ...inputStyle, flex: 1, fontFamily: MONO }} />
        <input type="number" placeholder="Already saved" min="0" step="0.01" value={draftInitial} onChange={(e) => setDraftInitial(e.target.value)} style={{ ...inputStyle, flex: 1, fontFamily: MONO }} />
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
      <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
        <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0 48px' }}>

      {/* Monthly Income */}
      <section style={{ marginBottom: 36 }}>
        <SectionTitle>Monthly Income</SectionTitle>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 200 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#888' }}>$</span>
            <input
              type="number"
              placeholder="0"
              min="0"
              step="1"
              value={incomeValue}
              onChange={(e) => { setIncomeValue(e.target.value); setIncomeSaved(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveIncome(); }}
              style={{ ...inputStyle, paddingLeft: 22, fontFamily: MONO, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={handleSaveIncome}
            disabled={savingIncome || !incomeValue}
            style={{
              border: 'none',
              background: incomeSaved ? '#0F9D58' : savingIncome || !incomeValue ? '#d8d8d8' : '#1a1a1a',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 500,
              cursor: savingIncome || !incomeValue ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
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
