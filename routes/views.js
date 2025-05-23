const express = require('express');
const { checkRole, authenticateToken, requireAdmin, requireManager, requireEmployee } = require('../middleware/auth.js');

const router = express.Router();

// Главная страница
router.get('/', (req, res) => {
    res.render('index');
});

// Страница логина
router.get('/login', (req, res) => {
    res.render('auth/login');
});

// Admin routes
router.get('/admin', checkRole('admin'), (req, res) => {
    res.render('admin/index');
});

router.get('/admin/employees', checkRole('admin'), (req, res) => {
    res.render('admin/employees');
});

router.get('/admin/departments', checkRole('admin'), (req, res) => {
    res.render('admin/departments');
});

// Manager routes
router.get('/manager', checkRole('manager'), (req, res) => {
    res.render('manager/index');
});

router.get('/manager/categories', checkRole('manager'), (req, res) => {
    res.render('manager/categories');
});

router.get('/manager/statistics', checkRole('manager'), (req, res) => {
    res.render('manager/statistics');
});

router.get('/manager/balance', checkRole('manager'), (req, res) => {
    res.render('manager/balance');
});

// Employee routes
router.get('/employee', checkRole('employee'), (req, res) => {
    res.render('employee/index');
});

router.get('/employee/statistics', checkRole('employee'), (req, res) => {
    res.render('employee/statistics');
});

router.get('/employee/transactions', checkRole('employee'), (req, res) => {
    res.render('employee/transactions');
});

// 404
router.use((req, res, next) => {
    res.status(404).render('404');
});

module.exports = router;