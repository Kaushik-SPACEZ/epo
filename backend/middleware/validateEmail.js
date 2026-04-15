/**
 * Email validation middleware for Express routes.
 * Validates the `email` field in req.body before passing to the handler.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Validates req.body.email.
 * Returns 400 if the email is missing or malformed.
 */
function validateEmailField(req, res, next) {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Email is required',
    });
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email address. Please provide a valid email (e.g. name@example.com)',
    });
  }

  // Normalize: lowercase & trim before passing along
  req.body.email = email.trim().toLowerCase();
  next();
}

/**
 * Validates req.body.identifier if it looks like an email.
 * Used for forgot-password where identifier can be email OR phone.
 */
function validateIdentifierIfEmail(req, res, next) {
  const { identifier, email } = req.body;
  const value = identifier || email;

  if (value && typeof value === 'string' && value.includes('@')) {
    if (!EMAIL_REGEX.test(value.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address. Please provide a valid email (e.g. name@example.com)',
      });
    }
    // Normalize
    if (identifier) req.body.identifier = value.trim().toLowerCase();
    if (email) req.body.email = value.trim().toLowerCase();
  }

  next();
}

module.exports = { validateEmailField, validateIdentifierIfEmail };
