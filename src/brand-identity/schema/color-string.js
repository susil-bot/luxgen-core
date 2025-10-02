const Joi = require('joi');

const REGEX_COLOR_STRING =
  /(#([\da-f]{3}){1,2}|(rgb)a\((\d{1,3}%?,\s?){3}(1|0?\.?\d+)\)|rgb\(\d{1,3}%?(,\s?\d{1,3}%?){2}\))/i;
const ERROR_COLOR = 'Not a valid hex or rgba string \n';

module.exports = Joi.string()
  .allow(null)
  .regex(REGEX_COLOR_STRING)
  .required()
  .label(ERROR_COLOR);
