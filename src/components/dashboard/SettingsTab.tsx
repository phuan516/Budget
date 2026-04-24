'use client';

import { useState } from 'react';
import { Config } from '@/lib/store/useStore';

const MONO = 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)';

interface Props {
  config: Config;
  isLoading: boolean;
  onAdd: (type: string, name: string, value?: string, extra?: string) => Promise<void>;
  onDelete: (type: string, id: string) => Promise<void>;
  onSetIncome: (amount: number) => Promise<void>;
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
  title, items, type, onAdd, onDelete,
}: {
  title: string;
  items: { id: string; name: string }[];
  type: string;
  onAdd: (type: string, name: string) => Promise<void>;
  onDelete: (type: string, id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  return (
    <section style={{ marginBottom: 36 }}>
      <SectionTitle>{title}</SectionTitle>
      {items.length > 0 && (
        <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
              <span style={{ flex: 1, fontSize: 13, color: '#1a1a1a' }}>{item.name}</span>
              <DeleteBtn onClick={() => handleDelete(item.id)} loading={deletingId === item.id} />
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

/* ─── name + amount list section (fixed expenses, saving goals) ─ */
function AmountListSection({
  title, items, type, amountLabel, onAdd, onDelete,
}: {
  title: string;
  items: { id: string; name: string; amount: number }[];
  type: string;
  amountLabel: string;
  onAdd: (type: string, name: string, value: string) => Promise<void>;
  onDelete: (type: string, id: string) => Promise<void>;
}) {
  const [draftName, setDraftName] = useState('');
  const [draftAmount, setDraftAmount] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd() {
    if (!draftName.trim() || !draftAmount) return;
    const name = draftName.trim();
    const amount = draftAmount;
    setDraftName('');
    setDraftAmount('');
    setAdding(true);
    try { await onAdd(type, name, amount); }
    finally { setAdding(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try { await onDelete(type, id); }
    finally { setDeletingId(null); }
  }

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });

  return (
    <section style={{ marginBottom: 36 }}>
      <SectionTitle>{title}</SectionTitle>
      {items.length > 0 && (
        <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
              <span style={{ flex: 1, fontSize: 13, color: '#1a1a1a' }}>{item.name}</span>
              <span style={{ fontSize: 13, color: '#444', fontFamily: MONO, marginRight: 8 }}>{fmt(item.amount)}</span>
              <DeleteBtn onClick={() => handleDelete(item.id)} loading={deletingId === item.id} />
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
        <input
          type="number"
          placeholder={amountLabel}
          min="0"
          step="0.01"
          value={draftAmount}
          onChange={(e) => setDraftAmount(e.target.value)}
          style={{ ...inputStyle, flex: 1, fontFamily: MONO }}
        />
        <AddButton onClick={handleAdd} disabled={adding || !draftName.trim() || !draftAmount} />
      </div>
    </section>
  );
}

/* ─── saving goals (name + target + initial) ─────────────────── */
function SavingGoalSection({
  items, onAdd, onDelete,
}: {
  items: { id: string; name: string; amount: number; initialAmount: number }[];
  onAdd: (type: string, name: string, value: string, extra: string) => Promise<void>;
  onDelete: (type: string, id: string) => Promise<void>;
}) {
  const [draftName, setDraftName] = useState('');
  const [draftTarget, setDraftTarget] = useState('');
  const [draftInitial, setDraftInitial] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  return (
    <section style={{ marginBottom: 36 }}>
      <SectionTitle>Saving Goals</SectionTitle>
      {items.length > 0 && (
        <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
              <span style={{ flex: 1, fontSize: 13, color: '#1a1a1a' }}>{item.name}</span>
              <span style={{ fontSize: 12, color: '#888', fontFamily: MONO, marginRight: 12 }}>
                target {fmt(item.amount)}
                {item.initialAmount > 0 && <> · saved {fmt(item.initialAmount)}</>}
              </span>
              <DeleteBtn onClick={() => handleDelete(item.id)} loading={deletingId === item.id} />
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

export default function SettingsTab({ config, isLoading, onAdd, onDelete, onSetIncome }: Props) {
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

      {/* Monthly Budget */}
      <section style={{ marginBottom: 36 }}>
        <SectionTitle>Monthly Budget</SectionTitle>
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
      />

      <NameListSection
        title="Cards & Payment Methods"
        items={config.cards}
        type="card"
        onAdd={onAdd}
        onDelete={onDelete}
      />

      <AmountListSection
        title="Fixed Expenses"
        items={config.fixedExpenses}
        type="fixed_expense"
        amountLabel="Amount / mo"
        onAdd={onAdd}
        onDelete={onDelete}
      />

      <SavingGoalSection
        items={config.savingGoals}
        onAdd={onAdd}
        onDelete={onDelete}
      />
    </div>
  );
}
