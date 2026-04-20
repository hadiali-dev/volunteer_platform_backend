const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/authControllers');
const validate = require('../middlewares/validate');
const { loginSchema, signupSchema } = require('../validation/auth.schema');

router.post('/signup', validate(signupSchema), AuthController.signup);
router.post('/login', validate(loginSchema), AuthController.login);

module.exports = router;
