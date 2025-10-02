const Joi = require('joi');
const colorStringValidator = require('./color-string');

const ERROR_TYPE_KEY = 'Container styles key missing';
const ANGLE_REGEX = /deg/;
const ERROR_ANGLE = 'Not a valid angle, please add the angle followed by `deg`';

const gradientStyleValidator = Joi.allow(
  'linear',
  'radial',
  'repeating-linear',
  'repeating-radial'
).required();

const angleStringValidator = Joi.string()
  .regex(ANGLE_REGEX)
  .required()
  .allow(null)
  .label(ERROR_ANGLE);

const gradientValidator = Joi.object({
  'gradient-style': gradientStyleValidator,
  angle: angleStringValidator,
  'color-stops': Joi.array().items(Joi.string()).required()
}).required();

const imageBackgroundValidator = Joi.object({
  url: Joi.string().allow(null),
  repeat: Joi.string()
    .allow('repeat', 'no-repeat', 'repeat-x', 'repeat-y', 'initial', 'inherit')
    .required(),
  color: colorStringValidator,
  attachment: Joi.string()
    .allow('scroll', 'fixed', 'local', 'initial', 'inherit')
    .required(),
  size: Joi.alternatives().try(
    Joi.string()
      .allow('cover', 'contain', 'auto', 'initial', 'inherit')
      .required(),
    Joi.array().items(Joi.string()).length(2).required()
  ),
  position: Joi.string()
    .allow(
      'left',
      'right',
      'top',
      'center',
      'left top',
      'left center',
      'left bottom',
      'right top',
      'right center',
      'right bottom',
      'center top',
      'center center',
      'center bottom',
      'initial',
      'inherit'
    )
    .required()
}).required();

const solidBackgroundValidator = Joi.object({
  color: colorStringValidator
});

const patternValidator = Joi.array().items(
  Joi.object().keys({
    gradient: gradientValidator.optional(),
    image: imageBackgroundValidator.optional(),
    solid: solidBackgroundValidator.optional()
  })
);

module.exports = Joi.object()
  .keys({
    'page-background': Joi.object({
      pattern: patternValidator
    }).allow(null),
    'main-background': Joi.object({
      pattern: patternValidator
    }).allow(null),
    'block-background': Joi.object({
      pattern: patternValidator
    }).allow(null),
    'item-background': Joi.object({
      pattern: patternValidator
    }).allow(null),
    'content-background': Joi.object({
      pattern: patternValidator
    }).allow(null),
    'lede-background': Joi.object({
      pattern: patternValidator
    }).allow(null)
  })
  .required()
  .label(ERROR_TYPE_KEY);
