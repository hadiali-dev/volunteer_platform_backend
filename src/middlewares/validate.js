const { ZodError } = require('zod');

const AppError = require('../utils/AppError');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = error.issues.map((issue) => issue.message).join(', ');
      return next(new AppError(errorMessage, 400));
    }

    return next(error);
  }
};

module.exports = validate;
