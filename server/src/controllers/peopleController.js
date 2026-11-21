import Expense from '../models/Expense.js';
import Person from '../models/Person.js';

export async function listPeople(req, res) {
  const people = await Person.find().sort({ createdAt: 1 });
  res.json(people);
}

export async function createPerson(req, res) {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const person = await Person.create({ name, nameKey: name.toLocaleLowerCase(), color: req.body.color });
  res.status(201).json(person);
}

export async function deletePerson(req, res) {
  const person = await Person.findByIdAndDelete(req.params.id);
  if (!person) return res.status(404).json({ message: 'Person not found.' });
  await Expense.deleteMany({ paidBy: person._id });
  res.json({ message: 'Person deleted.', id: person.id });
}
