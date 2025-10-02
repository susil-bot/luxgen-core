const Joi = require('joi');

const ERROR_LINE_WIDTH = 'Line width missing or not a number';
const ERROR_RADIUS = 'Radius value missing or not a number';
const ERROR_LINE_LENGTH = 'Line length value missing or not a number';
const ERROR_LINE_STYLE = 'Line style value missing or not an allowed value';
const ERROR_BREAKPOINT = 'key: breakpoint missing';

const lineStyleValidator = Joi.alternatives()
  .try('solid', 'dashed', 'dotted')
  .match('one');

const borderValidator = Joi.object({
  type: Joi.alternatives()
    .try('none', 'graphic-border-simple', 'graphic-border-full')
    .match('one'),
  file: Joi.string().allow(null, ''),
  thickness: Joi.number(),
  offset: Joi.number(),
  placement: Joi.alternatives()
    .try('grid', 'edge', 'outside', 'inside', 'offset')
    .match('one'),
  repeat: Joi.alternatives()
    .try('repeat', 'round', 'space', 'stretch')
    .match('one'),
  width: Joi.string().optional(),
  align: Joi.alternatives()
    .try('start', 'end', 'center')
    .match('one')
    .optional(),
  side: Joi.alternatives()
    .try('top', 'right', 'left', 'bottom')
    .match('one')
    .optional(),
  sides: Joi.object({
    top: Joi.number(),
    right: Joi.number(),
    bottom: Joi.number(),
    left: Joi.number()
  }).optional()
});

const badgeValidator = Joi.object({
  file: Joi.string().allow(null, ''),
  height: Joi.number(),
  type: Joi.alternatives().try('none', 'badge').match('one'),
  offsetX: Joi.number(),
  offsetY: Joi.number(),
  placement: Joi.alternatives().try('center', 'inside', 'outside').match('one'),
  rotation: Joi.number(),
  width: Joi.number(),
  x: Joi.alternatives().try('start', 'end', 'center').match('one'),
  y: Joi.alternatives().try('start', 'end', 'center').match('one')
});

const backgroundValidator = Joi.object({
  type: Joi.alternatives().try('none', 'background').match('one'),
  file: Joi.string().allow(null, ''),
  attachment: Joi.alternatives().try('initial', 'fixed').match('one'),
  position: Joi.alternatives()
    .try('initial', 'bottom', 'center', 'left', 'right', 'top')
    .match('one'),
  repeat: Joi.alternatives()
    .try('no-repeat', 'repeat', 'repeat-x', 'repeat-y')
    .match('one'),
  size: Joi.alternatives().try('auto', 'contain', 'cover').match('one')
});

module.exports = Joi.object()
  .keys({
    standard: Joi.object().keys({ logo: Joi.string().optional() }).optional(),
    inverted: Joi.object().keys({ logo: Joi.string().optional() }).optional(),
    'soft-linen': Joi.object()
      .keys({ logo: Joi.string().optional() })
      .optional(),
    borderRadius: Joi.number().required().label(ERROR_RADIUS),
    borderStyle: lineStyleValidator.required().label(ERROR_LINE_STYLE),
    borderWidth: Joi.number().required().label(ERROR_LINE_WIDTH),
    cardRadiusLg: Joi.number().required().label(ERROR_RADIUS),
    cardRadiusMd: Joi.number().required().label(ERROR_RADIUS),
    cardRadiusSm: Joi.number().required().label(ERROR_RADIUS),
    dividerStyle: lineStyleValidator.required().label(ERROR_LINE_STYLE),
    dividerWidth: Joi.number().required().label(ERROR_LINE_WIDTH),
    iconProfileRadius: Joi.number().required().label(ERROR_RADIUS),
    navigationRuleStyle: lineStyleValidator.required().label(ERROR_LINE_STYLE),
    navigationRuleWidth: Joi.number().required().label(ERROR_LINE_WIDTH),
    sectionOrnamentLength: Joi.number().required().label(ERROR_LINE_LENGTH),
    sectionOrnamentStyle: lineStyleValidator.required().label(ERROR_LINE_STYLE),
    sectionOrnamentWidth: Joi.number().required().label(ERROR_LINE_WIDTH),
    titleBorderDecoration: borderValidator,
    sectionBorderPrimary: borderValidator,
    sectionBorderSecondary: borderValidator,
    sectionBorderTertiary: borderValidator,
    badgePrimarySm: badgeValidator,
    badgePrimaryMd: badgeValidator,
    badgePrimaryLg: badgeValidator,
    badgeSecondarySm: badgeValidator,
    badgeSecondaryMd: badgeValidator,
    badgeSecondaryLg: badgeValidator,
    badgeFlagSm: badgeValidator,
    badgeFlagMd: badgeValidator,
    badgeFlagLg: badgeValidator,
    backgroundImagePrimary: backgroundValidator,
    backgroundImageSecondary: backgroundValidator
  })
  .required()
  .label(ERROR_BREAKPOINT);
