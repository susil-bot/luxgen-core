const Joi = require('joi');

const paddingValidator = [
  Joi.number(),
  Joi.array().items(Joi.number()).min(2).max(4)
];

const navigationBaseValidator = Joi.object().keys({
  hasPrimary: Joi.boolean(),
  hasSecondary: Joi.boolean(),
  'align-logo': Joi.string(),
  'logo-height': Joi.any(),
  'logo-padding': paddingValidator
});

const maxWidthValidator = [Joi.number(), Joi.string().allow('100%')];

module.exports = Joi.object().keys({
  header: Joi.object().keys({
    'container-spacing-unit': Joi.number(),
    sm: navigationBaseValidator,
    md: navigationBaseValidator,
    lg: navigationBaseValidator,
    xl: navigationBaseValidator,
    'max-width': maxWidthValidator
  })
});
