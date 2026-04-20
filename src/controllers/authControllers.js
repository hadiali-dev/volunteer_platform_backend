const AuthService = require('../services/authservice');

class AuthController {
  static async signup(req, res) {
    const result = await AuthService.signup(req.body);

    res.status(201).json({
      status: 'success',
      token: result.token,
      data: {
        user: result.user,
      },
    });
  }

  static async login(req, res) {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);

    res.status(200).json({
      status: 'success',
      token: result.token,
      data: {
        user: result.user,
      },
    });
  }
}

module.exports = AuthController;
