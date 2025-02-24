import express from 'express';
import * as transactionController from '../controllers/transactionController.js';
import { authenticateToken, requireEmployee } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, requireEmployee, transactionController.addTransaction);

export default router;