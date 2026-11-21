import Expense from '../models/Expense.js';
import Person from '../models/Person.js';

export async function listPeople(req, res) {
  const people = await Person.find().sort({ createdAt: 1 });
  res.json(people);
}

export async function createPerson(req, res) {
  const person = await Person.create({ name: req.body.name, color: req.body.color });
  res.status(201).json(person);
}

export async function updatePerson(req, res) {
  const person = await Person.findByIdAndUpdate(
    req.params.id,
    { name: req.body.name, ...(req.body.color !== undefined ? { color: req.body.color } : {}) },
    { new: true, runValidators: true, omitUndefined: true },
  );
  if (!person) return res.status(404).json({ message: 'Person not found.' });
  res.json(person);
}

export async function deletePerson(req, res) {
  const hasExpenses = await Expense.exists({ paidBy: req.params.id });
  if (hasExpenses) {
    return res.status(409).json({ message: 'Delete this person’s expenses before removing them.' });
  }

  const person = await Person.findByIdAndDelete(req.params.id);
  if (!person) return res.status(404).json({ message: 'Person not found.' });
  res.json({ message: 'Person deleted.', id: person.id });
}
