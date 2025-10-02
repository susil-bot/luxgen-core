const Joi = require('joi');
const colorStringValidator = require('./color-string');

const ERROR_TYPE_KEY = 'Color type key missing';
const paletteItemRegex = /[a-zA-Z0-9]{2,}/;

const paletteItemValidator = Joi.string().regex(paletteItemRegex);

const backwardsCompatibleColorTokenValidator = Joi.alternatives().try(
  paletteItemValidator,
  colorStringValidator
);

const interactiveElementsValidator = Joi.object({
  base: {
    'brand-primary': backwardsCompatibleColorTokenValidator,
    'brand-secondary': backwardsCompatibleColorTokenValidator,
    white: backwardsCompatibleColorTokenValidator,
    light: backwardsCompatibleColorTokenValidator,
    dark: backwardsCompatibleColorTokenValidator,
    black: backwardsCompatibleColorTokenValidator,
    body: backwardsCompatibleColorTokenValidator,
    deemphasized: backwardsCompatibleColorTokenValidator,
    border: backwardsCompatibleColorTokenValidator,
    highlight: backwardsCompatibleColorTokenValidator,
    hover: backwardsCompatibleColorTokenValidator
  },
  feedback: {
    'valid-primary': backwardsCompatibleColorTokenValidator,
    'valid-secondary': backwardsCompatibleColorTokenValidator,
    'invalid-primary': backwardsCompatibleColorTokenValidator,
    'invalid-secondary': backwardsCompatibleColorTokenValidator,
    'notice-primary': backwardsCompatibleColorTokenValidator,
    'notice-secondary': backwardsCompatibleColorTokenValidator,
    'alert-primary': backwardsCompatibleColorTokenValidator,
    'alert-secondary': backwardsCompatibleColorTokenValidator
  },
  social: {
    primary: backwardsCompatibleColorTokenValidator,
    'primary-hover': backwardsCompatibleColorTokenValidator,
    secondary: backwardsCompatibleColorTokenValidator,
    'secondary-hover': backwardsCompatibleColorTokenValidator
  }
});

const consumptionBodyColorValidator = Joi.object({
  'bg-photo': backwardsCompatibleColorTokenValidator,
  'bg-card': backwardsCompatibleColorTokenValidator,
  body: backwardsCompatibleColorTokenValidator,
  'display-signature': backwardsCompatibleColorTokenValidator,
  'display-texture': backwardsCompatibleColorTokenValidator,
  'body-deemphasized': backwardsCompatibleColorTokenValidator,
  accent: backwardsCompatibleColorTokenValidator,
  divider: backwardsCompatibleColorTokenValidator,
  link: backwardsCompatibleColorTokenValidator,
  'link-hover': backwardsCompatibleColorTokenValidator,
  subhed: backwardsCompatibleColorTokenValidator,
  adlabel: backwardsCompatibleColorTokenValidator
});

const consumptionLeadColorValidator = Joi.object({
  background: backwardsCompatibleColorTokenValidator,
  heading: backwardsCompatibleColorTokenValidator,
  'heading-background': backwardsCompatibleColorTokenValidator,
  'context-signature': backwardsCompatibleColorTokenValidator,
  'context-texture': backwardsCompatibleColorTokenValidator,
  'context-tertiary': backwardsCompatibleColorTokenValidator,
  description: backwardsCompatibleColorTokenValidator,
  accreditation: backwardsCompatibleColorTokenValidator,
  syndication: backwardsCompatibleColorTokenValidator,
  accent: backwardsCompatibleColorTokenValidator,
  divider: backwardsCompatibleColorTokenValidator,
  link: backwardsCompatibleColorTokenValidator,
  'link-hover': backwardsCompatibleColorTokenValidator
});

const consumptionColorValidator = Joi.object({
  body: {
    standard: consumptionBodyColorValidator,
    special: consumptionBodyColorValidator,
    inverted: consumptionBodyColorValidator
  },
  lead: {
    standard: consumptionLeadColorValidator,
    special: consumptionLeadColorValidator,
    inverted: consumptionLeadColorValidator
  }
});

const discoveryLeadColorValidator = Joi.object({
  background: backwardsCompatibleColorTokenValidator,
  hed: backwardsCompatibleColorTokenValidator,
  description: backwardsCompatibleColorTokenValidator,
  accent: backwardsCompatibleColorTokenValidator,
  divider: backwardsCompatibleColorTokenValidator,
  link: backwardsCompatibleColorTokenValidator,
  'link-hover': backwardsCompatibleColorTokenValidator
});

const discoveryBodyColorValidator = Joi.object({
  background: backwardsCompatibleColorTokenValidator,
  heading: backwardsCompatibleColorTokenValidator,
  'heading-background': backwardsCompatibleColorTokenValidator,
  'context-signature': backwardsCompatibleColorTokenValidator,
  'context-texture': backwardsCompatibleColorTokenValidator,
  'context-tertiary': backwardsCompatibleColorTokenValidator,
  description: backwardsCompatibleColorTokenValidator,
  accreditation: backwardsCompatibleColorTokenValidator,
  syndication: backwardsCompatibleColorTokenValidator,
  accent: backwardsCompatibleColorTokenValidator,
  divider: backwardsCompatibleColorTokenValidator,
  border: backwardsCompatibleColorTokenValidator
});

const discoveryColorValidator = Joi.object({
  lead: {
    primary: discoveryLeadColorValidator,
    secondary: discoveryLeadColorValidator
  },
  body: {
    white: discoveryBodyColorValidator,
    light: discoveryBodyColorValidator,
    brand: discoveryBodyColorValidator,
    dark: discoveryBodyColorValidator,
    black: discoveryBodyColorValidator
  }
});

const backgroundAdContainerColorValidator = Joi.object({
  standard: backwardsCompatibleColorTokenValidator,
  special: backwardsCompatibleColorTokenValidator,
  inverted: backwardsCompatibleColorTokenValidator,
  sticky: backwardsCompatibleColorTokenValidator
});

const backgroundColorValidator = Joi.object({
  white: backwardsCompatibleColorTokenValidator,
  light: backwardsCompatibleColorTokenValidator,
  brand: backwardsCompatibleColorTokenValidator,
  dark: backwardsCompatibleColorTokenValidator,
  black: backwardsCompatibleColorTokenValidator,
  adContainer: backgroundAdContainerColorValidator
});

const navigationStructure = Joi.object({
  active: backwardsCompatibleColorTokenValidator,
  'background-primary': backwardsCompatibleColorTokenValidator,
  'background-secondary': backwardsCompatibleColorTokenValidator,
  'background-tertiary': backwardsCompatibleColorTokenValidator,
  border: backwardsCompatibleColorTokenValidator,
  disabled: backwardsCompatibleColorTokenValidator,
  divider: backwardsCompatibleColorTokenValidator,
  focus: backwardsCompatibleColorTokenValidator,
  hover: backwardsCompatibleColorTokenValidator,
  'hover-brand': backwardsCompatibleColorTokenValidator,
  'item-accent': backwardsCompatibleColorTokenValidator,
  'item-brand': backwardsCompatibleColorTokenValidator,
  'item-emphasis': backwardsCompatibleColorTokenValidator,
  'item-primary': backwardsCompatibleColorTokenValidator,
  'item-secondary': backwardsCompatibleColorTokenValidator,
  pressed: backwardsCompatibleColorTokenValidator,
  overlay: backwardsCompatibleColorTokenValidator,
  'pressed-brand': backwardsCompatibleColorTokenValidator
});

const navigationValidator = Joi.object({
  standard: navigationStructure,
  inverted: navigationStructure.optional()
});

const foundationColorValidator = Joi.object({
  ad: {
    'background-inverted': backwardsCompatibleColorTokenValidator,
    'background-standard': backwardsCompatibleColorTokenValidator,
    'label-inverted': backwardsCompatibleColorTokenValidator,
    'label-standard': backwardsCompatibleColorTokenValidator
  },
  'menu-bg': {
    collapsed: backwardsCompatibleColorTokenValidator,
    accent: backwardsCompatibleColorTokenValidator,
    expanded: backwardsCompatibleColorTokenValidator
  },
  'collapsed-menu': {
    'nav-link': {
      default: backwardsCompatibleColorTokenValidator,
      hover: backwardsCompatibleColorTokenValidator
    },
    'utility-link': {
      default: backwardsCompatibleColorTokenValidator,
      hover: backwardsCompatibleColorTokenValidator
    }
  },
  'expanded-menu': {
    'nav-link': {
      default: backwardsCompatibleColorTokenValidator,
      hover: backwardsCompatibleColorTokenValidator
    },
    'utility-link': {
      default: backwardsCompatibleColorTokenValidator,
      hover: backwardsCompatibleColorTokenValidator
    }
  },
  'expanded-utility': {
    'nav-link': {
      default: backwardsCompatibleColorTokenValidator,
      hover: backwardsCompatibleColorTokenValidator
    }
  },
  'expanded-context': backwardsCompatibleColorTokenValidator,
  menu: {
    dividers: backwardsCompatibleColorTokenValidator
  },
  icon: {
    default: backwardsCompatibleColorTokenValidator,
    hover: backwardsCompatibleColorTokenValidator
  },
  footer: {
    bg: backwardsCompatibleColorTokenValidator,
    accent: backwardsCompatibleColorTokenValidator,
    'meta-primary': backwardsCompatibleColorTokenValidator,
    'meta-secondary': backwardsCompatibleColorTokenValidator,
    context: backwardsCompatibleColorTokenValidator,
    links: {
      primary: backwardsCompatibleColorTokenValidator,
      secondary: backwardsCompatibleColorTokenValidator
    },
    social: {
      hover: backwardsCompatibleColorTokenValidator
    }
  }
});

module.exports = Joi.object()
  .keys({
    palette: Joi.object()
      .pattern(paletteItemRegex, colorStringValidator)
      .optional(),
    consumption: consumptionColorValidator,
    discovery: discoveryColorValidator,
    foundation: foundationColorValidator,
    background: backgroundColorValidator,
    interactive: interactiveElementsValidator,
    navigation: navigationValidator.optional()
  })
  .required()
  .label(ERROR_TYPE_KEY);
