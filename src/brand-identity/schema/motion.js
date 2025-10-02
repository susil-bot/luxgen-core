const Joi = require('joi');

const ERROR_BREAKPOINT = 'key: breakpoint missing';

module.exports = Joi.object()
  .keys({
    duration: Joi.object().keys({
      0: Joi.string().required(),
      100: Joi.string().required(),
      150: Joi.string().required(),
      200: Joi.string().required(),
      250: Joi.string().required(),
      300: Joi.string().required(),
      400: Joi.string().required(),
      500: Joi.string().required(),
      800: Joi.string().required(),
      1200: Joi.string().required()
    }),
    delay: Joi.object().keys({
      50: Joi.string().required(),
      100: Joi.string().required(),
      150: Joi.string().required(),
      200: Joi.string().required(),
      250: Joi.string().required(),
      300: Joi.string().required(),
      400: Joi.string().required(),
      500: Joi.string().required(),
      700: Joi.string().required()
    }),
    easing: Joi.object().keys({
      linear: Joi.string(),
      'standard-in-and-out': Joi.string().required(),
      'standard-in': Joi.string().required(),
      'standard-out': Joi.string().required(),
      'emphasized-in-and-out': Joi.string().required(),
      'emphasized-in': Joi.string().required(),
      'emphasized-out': Joi.string().required(),
      'playful-in-and-out': Joi.string().required(),
      'playful-in': Joi.string().required(),
      'playful-out': Joi.string().required()
    }),
    pattern: Joi.object().keys({
      move: Joi.object().keys({
        easing: Joi.string(),
        duration: Joi.string()
      }),
      'move-enter': Joi.object().keys({
        easing: Joi.string(),
        duration: Joi.string()
      }),
      'move-exit': Joi.object().keys({
        easing: Joi.string(),
        duration: Joi.string()
      }),
      'fade-in-instant': Joi.object().keys({
        easing: Joi.string(),
        duration: Joi.string()
      }),
      'fade-in-medium': Joi.object().keys({
        easing: Joi.string(),
        duration: Joi.string()
      }),
      'fade-out-medium': Joi.object().keys({
        easing: Joi.string(),
        duration: Joi.string()
      }),
      collapse: Joi.object().keys({
        easing: Joi.string(),
        duration: Joi.string()
      }),
      expand: Joi.object().keys({
        easing: Joi.string(),
        duration: Joi.string()
      }),
      spin: Joi.object().keys({
        easing: Joi.string(),
        duration: Joi.string()
      }),
      rotate180: Joi.object().keys({
        easing: Joi.string(),
        duration: Joi.string()
      })
    })
  })
  .required()
  .label(ERROR_BREAKPOINT);
