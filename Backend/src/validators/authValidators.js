import Joi from 'joi';

/**
 * Validation schemas for authentication routes
 */

export const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .trim()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required'
    }),

  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
      'any.required': 'Password is required'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your password'
    }),

  phoneNumber: Joi.string()
    .pattern(/^\+?[\d\s-()]+$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    })
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),

  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
      'any.required': 'New password is required'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your new password'
    })
});

export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .trim()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters'
    }),

  phoneNumber: Joi.string()
    .pattern(/^\+?[\d\s-()]+$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),

  profileImage: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'Please provide a valid image URL'
    })
});

export const linkProviderSchema = Joi.object({
  provider: Joi.string()
    .valid('google', 'facebook', 'twitter')
    .required()
    .messages({
      'any.only': 'Invalid provider',
      'any.required': 'Provider is required'
    }),

  providerId: Joi.string()
    .required()
    .messages({
      'any.required': 'Provider ID is required'
    })
});

export const unlinkProviderSchema = Joi.object({
  provider: Joi.string()
    .valid('google', 'facebook', 'twitter')
    .required()
    .messages({
      'any.only': 'Invalid provider',
      'any.required': 'Provider is required'
    })
});

export const deleteAccountSchema = Joi.object({
  password: Joi.string()
    .optional()
    .messages({
      'string.base': 'Password must be a string'
    })
});

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Specific validation middleware for each route
 */
export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);
export const validateRefreshToken = validate(refreshTokenSchema);
export const validateChangePassword = validate(changePasswordSchema);
export const validateUpdateProfile = validate(updateProfileSchema);
export const validateLinkProvider = validate(linkProviderSchema);
export const validateUnlinkProvider = validate(unlinkProviderSchema);
export const validateDeleteAccount = validate(deleteAccountSchema);
