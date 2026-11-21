import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api.js';

const colors = ['#e6f0df', '#f9eadf', '#e7eef8', '#f0e9f7', '#f8e9e9', '#e5f1ef'];
const expenseIcons = ['☕', '⌂', '✳', '▤', '♧'];
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
const getId = (person) => person?._id || person?.id;

function calculate(people, expenses) {
  const paid = new Map(people.map((person) => [getId(person), 0]));
  const total = expenses.reduce((sum, expense) => {
    const amount = Number(expense.amount) || 0;
    const payerId = getId(expense.paidBy) || expense.paidBy;
    if (paid.has(payerId)) paid.set(payerId, paid.get(payerId) + amount);
    return sum + amount;
  }, 0);
  const share = people.length ? total / people.length : 0;
  const balances = people.map((person) => ({ person, amount: (paid.get(getId(person)) || 0) - share }));
  const creditors = balances.filter((row) => row.amount > 0.005).map((row) => ({ ...row, amount: row.amount })).sort((a, b) => b.amount - a.amount);
  const debtors = balances.filter((row) => row.amount < -0.005).map((row) => ({ ...row, amount: -row.amount })).sort((a, b) => b.amount - a.amount);
  const settlements = [];
  let debtorIndex = 0;
  let creditorIndex = 0;
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const amount = Math.min(debtors[debtorIndex].amount, creditors[creditorIndex].amount);
    settlements.push({ from: debtors[debtorIndex].person, to: creditors[creditorIndex].person, amount });
    debtors[debtorIndex].amount -= amount;
    creditors[creditorIndex].amount -= amount;
    if (debtors[debtorIndex].amount < 0.005) debtorIndex += 1;
    if (creditors[creditorIndex].amount < 0.005) creditorIndex += 1;
  }
  return { total, share, balances, settlements };
}

function App() {
  const [group, setGroup] = useState(() => localStorage.getItem('spliteasy-group-name') || 'Weekend crew');
  const [people, setPeople] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [personName, setPersonName] = useState('');
  const [expense, setExpense] = useState({ title: '', amount: '', paidBy: '' });
  const [editingExpense, setEditingExpense] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState('loading');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(''), 2600);
  }, []);

  const reloadData = useCallback(async () => {
    const [nextPeople, nextExpenses] = await Promise.all([api.people.list(), api.expenses.list()]);
    setPeople(nextPeople);
    setExpenses(nextExpenses);
    setExpense((current) => ({ ...current, paidBy: current.paidBy || getId(nextPeople[0]) || '' }));
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await api.health();
        if (!mounted) return;
        setApiStatus('online');
        await reloadData();
      } catch (requestError) {
        if (!mounted) return;
        setApiStatus('offline');
        setError(requestError.message);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [reloadData]);

  const breakdown = useMemo(() => calculate(people, expenses), [people, expenses]);

  async function runAction(action, successMessage) {
    setError('');
    try {
      await action();
      await reloadData();
      notify(successMessage);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }

  async function addPerson(event) {
    event.preventDefault();
    const name = personName.trim();
    if (!name) return;
    if (people.some((person) => person.name.toLowerCase() === name.toLowerCase())) {
      notify('That person is already in the crew.');
      return;
    }
    const created = await runAction(() => api.people.create({ name, color: colors[people.length % colors.length] }), `${name} added to the crew.`);
    if (created) setPersonName('');
  }

  async function removePerson(person) {
    await runAction(() => api.people.remove(getId(person)), `${person.name} removed.`);
  }

  async function saveExpense(event) {
    event.preventDefault();
    const amount = Number(expense.amount);
    if (!expense.title.trim() || !Number.isFinite(amount) || amount <= 0 || !expense.paidBy) return;
    const body = { description: expense.title.trim(), amount: Math.round(amount * 100) / 100, paidBy: expense.paidBy };
    const success = editingExpense
      ? await runAction(() => api.expenses.update(editingExpense, body), 'Expense updated.')
      : await runAction(() => api.expenses.create(body), 'Expense added and split equally.');
    if (success) {
      setExpense({ title: '', amount: '', paidBy: getId(people[0]) || '' });
      setEditingExpense(null);
    }
  }

  function startEditExpense(item) {
    setEditingExpense(getId(item));
    setExpense({ title: item.description, amount: String(item.amount), paidBy: getId(item.paidBy) || item.paidBy });
    document.getElementById('expenseTitle')?.focus();
  }

  async function removeExpense(item) {
    await runAction(() => api.expenses.remove(getId(item)), 'Expense removed.');
  }

  async function renameGroup() {
    const nextGroup = window.prompt('Name your group', group);
    if (!nextGroup?.trim()) return;
    const name = nextGroup.trim().slice(0, 40);
    setGroup(name);
    localStorage.setItem('spliteasy-group-name', name);
  }

  async function shareSummary() {
    const lines = [
      `${group} — SplitEasy`,
      `Total spent: ${money(breakdown.total)}`,
      ...breakdown.balances.map(({ person, amount }) => `${person.name}: share ${money(breakdown.share)} · ${amount > 0.005 ? `gets back ${money(amount)}` : amount < -0.005 ? `owes ${money(-amount)}` : 'all square'}`),
      '', 'Expenses:',
      ...expenses.map((item) => `• ${item.description} — ${money(item.amount)} (${item.paidBy?.name || 'Someone'} paid)`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      notify('Summary copied to clipboard.');
    } catch {
      window.prompt('Copy your group summary:', lines.join('\n'));
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="SplitEasy home"><span className="brand-mark">s</span><span>split<span className="brand-light">easy</span></span></a>
        <div className="side-label">YOUR SPACE</div>
        <button className="nav-item active" type="button"><span className="nav-icon">▦</span>Overview</button>
        <button className="nav-item" type="button" onClick={() => document.getElementById('peopleSection')?.scrollIntoView({ behavior: 'smooth' })}><span className="nav-icon">♧</span>People <span className="nav-count">{people.length}</span></button>
        <div className="side-bottom"><div className="help-icon">?</div><div><strong>Keep it simple.</strong><p>Good friends, clear splits.</p></div></div>
        <div className="side-foot">MADE FOR SHARING <span>✳</span></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumb">My groups <span>/</span> <strong>{group}</strong></div><div className="profile"><span className={`status-dot ${apiStatus}`} /> API {apiStatus === 'online' ? 'connected' : apiStatus === 'loading' ? 'connecting' : 'offline'} <span className="avatar">S</span></div></header>
        <section className="page-wrap">
          <div className="eyebrow"><span className="eyebrow-line" /> YOUR GROUP</div>
          <div className="hero-row"><div><h1>{group}<button className="edit-title" onClick={renameGroup} type="button" title="Rename group" aria-label="Rename group">✎</button></h1><p className="subhead">One trip, one table, no awkward math.</p></div><button className="outline-button" onClick={shareSummary} type="button"><span>↗</span> Share summary</button></div>

          {error && <div className="alert" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}

          <section className="people-card card" id="peopleSection">
            <div className="section-heading"><div><h2>The crew <span className="muted-count">{people.length} {people.length === 1 ? 'person' : 'people'}</span></h2><p>Add everyone who’s in on the expenses.</p></div></div>
            <form className="inline-form" onSubmit={addPerson}><input aria-label="Friend’s name" maxLength="24" placeholder="Friend’s name" value={personName} onChange={(event) => setPersonName(event.target.value)} required /><button className="primary-button" type="submit" disabled={apiStatus !== 'online'}>＋ Add person</button></form>
            <div className="people-list">{isLoading ? <div className="empty-note">Loading your crew…</div> : people.length ? people.map((person, index) => <div className="person-chip" key={getId(person)}><span className="person-avatar" style={{ background: person.color || colors[index % colors.length], color: '#526550' }}>{initials(person.name)}</span><span>{person.name}</span><button className="remove-person" type="button" onClick={() => removePerson(person)} title={`Remove ${person.name}`} aria-label={`Remove ${person.name}`}>×</button></div>) : <div className="empty-note">Your crew will show up here.</div>}</div>
          </section>

          <div className="dashboard-grid">
            <section className="card expense-card">
              <div className="section-heading"><div><h2>Expenses <span className="muted-count">{expenses.length} {expenses.length === 1 ? 'item' : 'items'}</span></h2><p>Every little thing, in one place.</p></div><span className="receipt-icon">▤</span></div>
              <form className="expense-form" onSubmit={saveExpense}>
                <label className="field-label" htmlFor="expenseTitle">WHAT WAS IT?</label>
                <input id="expenseTitle" className="input" maxLength="60" placeholder="e.g. Dinner at the beach" value={expense.title} onChange={(event) => setExpense({ ...expense, title: event.target.value })} required />
                <div className="form-row"><div className="field-grow"><label className="field-label" htmlFor="expenseAmount">TOTAL AMOUNT</label><div className="money-input"><span>₹</span><input id="expenseAmount" type="number" min="0.01" step="0.01" placeholder="0.00" value={expense.amount} onChange={(event) => setExpense({ ...expense, amount: event.target.value })} required /></div></div><div className="field-grow"><label className="field-label" htmlFor="paidBy">PAID BY</label><select id="paidBy" className="input" value={expense.paidBy} onChange={(event) => setExpense({ ...expense, paidBy: event.target.value })} required disabled={!people.length}><option value="" disabled>Select a person</option>{people.map((person) => <option value={getId(person)} key={getId(person)}>{person.name}</option>)}</select></div></div>
                <button className="primary-button add-expense" type="submit" disabled={apiStatus !== 'online' || !people.length}><span>{editingExpense ? '✓' : '＋'}</span> {editingExpense ? 'Save changes' : 'Add expense'}</button>
                {editingExpense && <button className="cancel-edit" type="button" onClick={() => { setEditingExpense(null); setExpense({ title: '', amount: '', paidBy: getId(people[0]) || '' }); }}>Cancel edit</button>}
                <p className="form-hint">{people.length ? 'Split equally across everyone in the crew.' : 'Add at least one person to start splitting.'}</p>
              </form>
              <div className="expense-list">{isLoading ? <div className="empty-note">Loading expenses…</div> : expenses.length ? expenses.map((item, index) => <div className="expense-row" key={getId(item)}><div className="expense-symbol" style={{ background: colors[index % colors.length] }}>{expenseIcons[index % expenseIcons.length]}</div><div className="expense-main"><div className="expense-name">{item.description}</div><div className="expense-meta">Paid by {item.paidBy?.name || 'Someone'} · {new Date(item.date || item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div></div><div className="expense-value">{money(item.amount)}</div><button className="edit-person" type="button" onClick={() => startEditExpense(item)} title={`Edit ${item.description}`} aria-label={`Edit ${item.description}`}>✎</button><button className="delete-expense" type="button" onClick={() => removeExpense(item)} title="Delete expense" aria-label={`Delete ${item.description}`}>×</button></div>) : <div className="empty-note">Your expenses will appear here.</div>}</div>
            </section>

            <section className="card balance-card">
              <div className="section-heading"><div><h2>The breakdown</h2><p>Everyone’s share, at a glance.</p></div><span className="balance-icon">↗</span></div>
              <div className="total-block"><span className="field-label">TOTAL SPENT</span><div className="total-amount">{money(breakdown.total)}</div><span className="total-caption">Across {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}</span></div>
              <div className="shares-heading"><span>PERSON</span><span>SHARE</span></div>
              <div className="share-list">{people.length ? breakdown.balances.map(({ person, amount }, index) => <div className="share-row" key={getId(person)}><div className="share-person"><span className="share-dot" style={{ background: person.color || colors[index % colors.length], color: '#526550' }}>{initials(person.name)}</span>{person.name}<span className={`net-tag ${amount > 0.005 ? 'owed' : amount < -0.005 ? 'owes' : ''}`}>{amount > 0.005 ? 'gets back' : amount < -0.005 ? 'owes' : 'all square'}</span></div><span className="share-value">{money(breakdown.share)}</span></div>) : <div className="empty-note">Add your crew to see everyone’s share.</div>}</div>
              <div className="settle-section"><div className="settle-title">SETTLE UP <span className="settle-spark">✳</span></div><div className="settlement-list">{breakdown.settlements.length ? breakdown.settlements.map((row, index) => <div className="settle-row" key={`${getId(row.from)}-${getId(row.to)}-${index}`}><strong>{row.from.name}</strong><span>pays</span><strong>{row.to.name}</strong><span className="settle-amount">{money(row.amount)}</span></div>) : <div className="settle-row" style={{ color: '#92998f' }}>{expenses.length ? 'Everyone is all square.' : 'Add expenses to see who owes whom.'}</div>}</div></div>
              <p className="balance-note"><span>ⓘ</span> Shares are split equally across the crew.</p>
            </section>
          </div>
          <footer className="page-footer">A LITTLE LESS MATH, A LOT MORE <span>✳</span></footer>
        </section>
      </main>
      {toast && <div className="toast show" role="status">{toast}</div>}
    </div>
  );
}

export default App;
