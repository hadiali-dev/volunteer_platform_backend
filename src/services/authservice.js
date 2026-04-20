const User = require('../models/user');
const AuthHelper = require('../utils/AuthHelper');
const AppError = require('../utils/AppError');

const buildAuthUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  image: user.image || null,
  active: user.active,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

class AuthService {
  static async signup(userData) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError('Email is already registered', 400);
    }

    const hashedPassword = await AuthHelper.hash(userData.password);
    const role = userData.role === 'organization' ? 'organization' : 'student';

    const newUser = await User.create({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role,
    });

    const token = AuthHelper.signToken(newUser._id);

    return {
      token,
      user: buildAuthUser(newUser),
    };
  }

  static async login(email, password) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Incorrect email or password', 401);
    }

    const isMatch = await AuthHelper.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Incorrect email or password', 401);
    }

    const token = AuthHelper.signToken(user._id);

    return {
      token,
      user: buildAuthUser(user),
    };
  }
}

module.exports = AuthService;
