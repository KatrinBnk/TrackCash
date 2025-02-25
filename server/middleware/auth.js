import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

export const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

export const requireEmployee = (req, res, next) => {
    if (req.user.role !== 'employee') {
        return res.status(403).json({ message: 'Employee access required' });
    }
    next();
};

export const requireManager = (req, res, next) => {
    if (req.user.role !== 'manager') {
        return res.status(403).json({ message: 'Manager access required' });
    }
    next();
};