import Expense from '../models/Expense.js';
import Person from '../models/Person.js';

const withPayer = (query) => query.populate('paidBy', 'name color');

export async function listExpenses(req, res) {
  const expenses = await withPayer(Expense.find()).sort({ date: -1, createdAt: -1 });
  res.json(expenses);
}

export async function createExpense(req, res) {
  const { amount, paidBy, date } = req.body;
  const description = req.body.description ?? req.body.title;
  const payer = await Person.findById(paidBy);
  if (!payer) return res.status(400).json({ message: 'Choose a person who is in the group.' });

  const expense = await Expense.create({ description, amount, paidBy, ...(date ? { date } : {}) });
  res.status(201).json(await withPayer(Expense.findById(expense.id)));
}

export async function updateExpense(req, res) {
  const { amount, paidBy, date } = req.body;
  const description = req.body.description ?? req.body.title;
  if (paidBy !== undefined && !await Person.exists({ _id: paidBy })) {
    return res.status(400).json({ message: 'Choose a person who is in the group.' });
  }

  const updates = {};
  if (description !== undefined) updates.description = description;
  for (const key of ['amount', 'paidBy', 'date']) if (req.body[key] !== undefined) updates[key] = req.body[key];
  const expense = await withPayer(Expense.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }));
  if (!expense) return res.status(404).json({ message: 'Expense not found.' });
  res.json(expense);
}

export async function deleteExpense(req, res) {
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) return res.status(404).json({ message: 'Expense not found.' });
  res.json({ message: 'Expense deleted.', id: expense.id });
}
