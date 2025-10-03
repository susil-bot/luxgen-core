/**
 * Top level of brand-idenity schema
 */

const Joi = require('joi');
const colors = require('./colors');
const patterns = require('./patterns');
const spacing = require('./spacing');
const decorations = require('./decorations');
const motion = require('./motion');
const typography = require('./typography');
const interactive = require('./interactive');
const navigation = require('./navigation');

module.exports = Joi.object().options({ abortEarly: false }).keys({
  colors,
  spacing,
  typography,
  'container-styles': patterns,
  decorations,
  motion,
  interactive,
  navigation
});
