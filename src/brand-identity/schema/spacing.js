const Joi = require('joi');

const ERROR_BOX_INSET = 'box-inset missing or not a number';
const ERROR_BREAKPOINT = 'key: breakpoint missing';

module.exports = Joi.object()
  .keys({
    'box-inset': Joi.number().required().label(ERROR_BOX_INSET),
    'spacing-0': Joi.string().required(),
    'spacing-4': Joi.string().required(),
    'spacing-8': Joi.string().required(),
    'spacing-12': Joi.string().required(),
    'spacing-16': Joi.string().required(),
    'spacing-24': Joi.string().required(),
    'spacing-32': Joi.string().required(),
    'spacing-40': Joi.string().required(),
    'spacing-48': Joi.string().required(),
    'spacing-56': Joi.string().required(),
    'spacing-64': Joi.string().required(),
    'spacing-96': Joi.string().required(),
    'spacing-128': Joi.string().required(),
    section: Joi.object()
      .keys({
        'gap-sm': Joi.string(),
        'gap-md': Joi.string(),
        'padding-top-sm': Joi.string(),
        'padding-top-md': Joi.string(),
        'padding-bottom-sm': Joi.string(),
        'padding-bottom-md': Joi.string()
      })
      .required()
  })
  .required()
  .label(ERROR_BREAKPOINT);
