const express = require('express');
const authController = require('../../controllers/authController.js');
const {authenticateToken, requireAdmin} = require('../../middleware/auth.js');

const router = express.Router();

router.post('/register', authenticateToken, requireAdmin, authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

module.exports = router;