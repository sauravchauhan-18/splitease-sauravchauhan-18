import { Router } from 'express';
import { createExpense, deleteExpense, listExpenses, updateExpense } from '../controllers/expensesController.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = Router();

router.route('/').get(listExpenses).post(createExpense);
router.route('/:id').put(validateObjectId, updateExpense).delete(validateObjectId, deleteExpense);

export default router;
