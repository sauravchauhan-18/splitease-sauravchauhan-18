import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'An expense description is required.'],
    trim: true,
    minlength: [1, 'An expense description cannot be empty.'],
    maxlength: [60, 'Expense descriptions can be at most 60 characters.'],
  },
  amount: {
    type: Number,
    required: [true, 'An amount is required.'],
    min: [0.01, 'The amount must be greater than zero.'],
    validate: {
      validator: Number.isFinite,
      message: 'The amount must be a valid number.',
    },
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
    required: [true, 'Select who paid for this expense.'],
  },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

expenseSchema.index({ date: -1, createdAt: -1 });

export default mongoose.model('Expense', expenseSchema);
