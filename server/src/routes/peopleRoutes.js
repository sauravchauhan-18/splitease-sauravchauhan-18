import { Router } from 'express';
import { createPerson, deletePerson, listPeople, updatePerson } from '../controllers/peopleController.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = Router();

router.route('/').get(listPeople).post(createPerson);
router.route('/:id').put(validateObjectId, updatePerson).delete(validateObjectId, deletePerson);

export default router;
