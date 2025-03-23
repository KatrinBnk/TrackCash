import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
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

export const checkRole = (requiredRole) => {
    return (req, res, next) => {
        const token = req.cookies.token;

        if (!token) {
            return res.redirect('/login');
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.role !== requiredRole) {
                return res.redirect(`/${decoded.role}`);
            }
            req.user = decoded;
            next();
        } catch (error) {
            return res.clearCookie('token').redirect('/login');
        }
    };
};