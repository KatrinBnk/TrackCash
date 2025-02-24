import db from '../config/db.js';

export const getDepartmentStats = async (req, res) => {
    const managerId = req.user.id;
    const { dateFrom, dateTo, category_id } = req.query;

    try {
        const [department] = await db.query('SELECT * FROM Departments WHERE manager_id = ?', [managerId]);
        if (!department.length) {
            return res.status(400).json({ message: 'Manager is not assigned to a department' });
        }
        const departmentId = department[0].id;

        const [employees] = await db.query('SELECT id FROM Users WHERE department_id = ? AND role = ?', [departmentId, 'employee']);

        if (!employees.length) {
            return res.status(200).json([]);
        }

        let query = 'SELECT * FROM Transactions WHERE user_id IN (?)';
        const params = [employees.map(emp => emp.id)];

        if (dateFrom) {
            query += ' AND date >= ?';
            params.push(dateFrom);
        }
        if (dateTo) {
            query += ' AND date <= ?';
            params.push(dateTo);
        }
        if (category_id) {
            query += ' AND category_id = ?';
            params.push(category_id);
        }

        console.log('Query:', query, 'Params:', params);
        const [transactions] = await db.query(query, params);
        console.log('Raw transactions:', transactions);

        const formattedTransactions = transactions.map(tx => ({
            ...tx,
            amount: parseFloat(tx.amount),
            date: new Date(tx.date).toISOString().split('T')[0]
        }));

        console.log('Formatted transactions:', formattedTransactions);
        res.status(200).json(formattedTransactions);
    } catch (err) {
        console.error('Error fetching department stats:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};