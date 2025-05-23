const express = require('express');
const categoryController = require('../../controllers/categoryController.js');
const { authenticateToken, requireManager } = require('../../middleware/auth.js');

const router = express.Router();

router.post('/', authenticateToken, requireManager, categoryController.createCategory);
router.get('/', authenticateToken, categoryController.getCategories);
router.put('/:id', authenticateToken, requireManager, categoryController.updateCategory);
router.delete('/:id', authenticateToken, requireManager, categoryController.deleteCategory);

module.exports = router;