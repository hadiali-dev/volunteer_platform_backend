const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthHelper {
    static async hash(password) {
        return await bcrypt.hash(password, 12);
    }

    static async compare(candidate, hash) {
        return await bcrypt.compare(candidate, hash);
    }

    static signToken(id) {
        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });
    }
}
module.exports = AuthHelper;