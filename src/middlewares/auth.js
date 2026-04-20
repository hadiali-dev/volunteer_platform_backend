const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const User = require('../models/user');

const protect = async (req, res, next) => {
    let token;

    // 1. البحث عن التوكن في الهيدر (Authorization: Bearer <TOKEN>)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // 2. إذا لم نجد توكن
    if (!token) {
        return next(new AppError('غير مسموح لك بالدخول، يرجى تسجيل الدخول', 401));
    }

    // 3. التحقق من صحة التوكن
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. التأكد أن المستخدم لا يزال موجوداً
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next(new AppError('المستخدم لم يعد موجوداً', 401));
        }

        req.user = currentUser;
        next();
        
    } catch (err) {
        return next(new AppError('التوكن غير صالح أو انتهت صلاحيته', 401));
    }
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('ليس لديك صلاحية', 403));
        }
        next();
    };
};

module.exports = { protect, restrictTo };