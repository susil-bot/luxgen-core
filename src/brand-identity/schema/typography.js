const Joi = require('joi');

const typeWeightValidator = Joi.number().min(100).max(900);

const lineHeightValidator = Joi.any()
  .allow(Joi.number(), Joi.string())
  .optional();

const typographyFileValidator = Joi.object().keys({
  files: Joi.object()
    .keys({
      woff: Joi.string().optional(),
      woff2: Joi.string().optional()
    })
    .or('woff', 'woff2'),
  italic: Joi.boolean(),
  weight: typeWeightValidator
});

const fontImportValidator = Joi.array().items(typographyFileValidator);

const typographyStylesValidator = Joi.object().keys({
  imports: fontImportValidator.optional(),
  fallback: Joi.string().optional(),
  fontvariant: Joi.string().optional(),
  textBoxTrim: Joi.boolean().optional()
});

const fontFeatureSettingsValidator = Joi.alternatives()
  .try('"normal"', '"palt"', '"calt" 0', '"tnum"')
  .match('one');

const lineBreakValidator = Joi.alternatives()
  .try('anywhere', 'auto', 'loose', 'normal', 'strict')
  .match('one');

const overflowWrapValidator = Joi.alternatives()
  .try('anywhere', 'break-word', 'normal')
  .match('one');

const baseFontValidator = Joi.object().keys({
  family: Joi.string(),
  weight: typeWeightValidator,
  'letter-spacing': Joi.number(),
  'line-height': lineHeightValidator,
  ligatures: Joi.boolean().allow(null, 'none'),
  case: Joi.alternatives()
    .try('normal', 'capitalize', 'lowercase', 'uppercase')
    .match('one'),
  italic: Joi.boolean(),
  'mobile-size': Joi.number(),
  fontSizeMd: Joi.number().optional(),
  fontSizeLg: Joi.number().optional(),
  lineHeightMd: Joi.number().optional(),
  lineHeightLg: Joi.number().optional(),
  'font-feature-settings': fontFeatureSettingsValidator.optional(),
  'line-break': lineBreakValidator.optional(),
  'overflow-wrap': overflowWrapValidator.optional()
});

const globalEditorialValidator = Joi.object().keys({
  'accreditation-core': baseFontValidator,
  'accreditation-feature': baseFontValidator,
  'context-primary': baseFontValidator,
  'context-secondary': baseFontValidator,
  'context-tertiary': baseFontValidator,
  'context-title': baseFontValidator,
  'numerical-large': baseFontValidator,
  'numerical-small': baseFontValidator,
  syndication: baseFontValidator,
  tags: baseFontValidator,
  'ad-label': baseFontValidator
});

const consumptionEditorialValidator = Joi.object().keys({
  'hed-feature': baseFontValidator,
  'hed-standard': baseFontValidator,
  'hed-bulletin': baseFontValidator,
  'subhed-break-primary': baseFontValidator,
  'subhed-break-secondary': baseFontValidator,
  'subhed-aux-primary': baseFontValidator,
  'subhed-aux-secondary': baseFontValidator,
  'body-bold': baseFontValidator,
  'body-core': baseFontValidator,
  'body-feature': baseFontValidator,
  citation: baseFontValidator,
  'display-large': baseFontValidator,
  'display-medium': baseFontValidator,
  'display-small': baseFontValidator,
  'description-feature': baseFontValidator,
  'description-core': baseFontValidator,
  'description-embed': baseFontValidator,
  'lead-in': baseFontValidator
});

const navigationValidator = Joi.object().keys({
  'text-label': baseFontValidator,
  'text-primary': baseFontValidator,
  'text-secondary': baseFontValidator,
  'text-tertiary': baseFontValidator
});

const discoveryValidator = Joi.object().keys({
  'page-hed-section': baseFontValidator,
  'page-hed-subsection': baseFontValidator,
  'hed-break-out': baseFontValidator,
  'hed-feature': baseFontValidator,
  'hed-core-primary': baseFontValidator,
  'hed-core-secondary': baseFontValidator,
  'hed-bulletin-primary': baseFontValidator,
  'hed-bulletin-secondary': baseFontValidator,
  'subhed-section-primary': baseFontValidator,
  'subhed-section-secondary': baseFontValidator,
  'subhed-section-tertiary': baseFontValidator,
  'subhed-section-collection': baseFontValidator,
  'description-feature': baseFontValidator,
  'description-core': baseFontValidator,
  'description-page': baseFontValidator
});

const foundationValidator = Joi.object().keys({
  'ad-label': baseFontValidator,
  'link-feature': baseFontValidator,
  'link-primary': baseFontValidator,
  'link-secondary': baseFontValidator,
  'link-utility': baseFontValidator,
  list: baseFontValidator,
  'title-primary': baseFontValidator,
  'title-secondary': baseFontValidator,
  'meta-primary': baseFontValidator,
  'meta-secondary': baseFontValidator
});

const utilityValidator = Joi.object().keys({
  label: baseFontValidator,
  'input-core': baseFontValidator,
  'input-feature': baseFontValidator,
  'assistive-text': baseFontValidator,
  'button-core': baseFontValidator,
  'button-bulletin': baseFontValidator,
  'button-utility': baseFontValidator,
  'card-heading': baseFontValidator,
  heading: baseFontValidator,
  subheading: baseFontValidator,
  description: baseFontValidator,
  body: baseFontValidator,
  'landing-heading': baseFontValidator,
  'landing-description': baseFontValidator,
  'landing-subheading': baseFontValidator,
  'landing-body': baseFontValidator,
  'legal-text': baseFontValidator,
  'list-heading': baseFontValidator,
  pricing: baseFontValidator,
  'pricing-secondary': baseFontValidator,
  'modal-hed': baseFontValidator,
  'modal-body': baseFontValidator
});

const commerceValidator = Joi.object().keys({
  'brand-name': baseFontValidator,
  'call-to-action': baseFontValidator,
  label: baseFontValidator,
  'product-description': baseFontValidator,
  'product-title': baseFontValidator
});

const fluidValueValidator = Joi.object().keys({
  min: Joi.string(),
  'clamp-ratio': Joi.string(),
  max: Joi.string()
});

const fluidFontValidator = Joi.object().keys({
  family: Joi.string(),
  weight: typeWeightValidator,
  case: Joi.alternatives()
    .try('normal', 'capitalize', 'lowercase', 'uppercase')
    .match('one'),
  style: Joi.alternatives().try('normal', 'italic').match('one'),
  'letter-spacing': Joi.string(),
  ligatures: Joi.boolean().allow(null, 'none'),
  'font-size': fluidValueValidator,
  'line-height': fluidValueValidator
});

const fluidValidator = Joi.object().keys({
  'headline-3xl': fluidFontValidator.optional(),
  'headline-2xl': fluidFontValidator.optional(),
  'headline-xl': fluidFontValidator.optional(),
  'headline-lg': fluidFontValidator.optional(),
  'headline-md': fluidFontValidator.optional(),
  'headline-sm': fluidFontValidator.optional(),
  'headline-xs': fluidFontValidator.optional()
});

module.exports = Joi.object().keys({
  typefaces: Joi.object().pattern(
    /^[a-zA-Z0-9-_'"\s]+$/,
    typographyStylesValidator.optional()
  ),
  definitions: Joi.object().keys({
    globalEditorial: globalEditorialValidator,
    consumptionEditorial: consumptionEditorialValidator,
    discovery: discoveryValidator,
    foundation: foundationValidator,
    navigation: navigationValidator.optional(),
    utility: utilityValidator,
    fluid: fluidValidator.optional(),
    commerce: commerceValidator
  })
});
