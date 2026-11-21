import cors from 'cors';
import express from 'express';
import expensesRoutes from './routes/expensesRoutes.js';
import peopleRoutes from './routes/peopleRoutes.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();
const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SplitEasy API' });
});
app.use('/api/people', peopleRoutes);
app.use('/api/expenses', expensesRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
