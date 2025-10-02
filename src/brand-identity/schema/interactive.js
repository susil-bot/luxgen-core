const Joi = require('joi');

const linkStyleValidator = Joi.object().keys({
  style: [Joi.string().allow('underline'), Joi.allow(null)]
});

const linkStateValidator = Joi.object().keys({
  link: linkStyleValidator,
  hover: linkStyleValidator,
  focus: linkStyleValidator,
  active: linkStyleValidator,
  visited: linkStyleValidator
});

module.exports = Joi.object().keys({
  links: Joi.object().keys({
    default: linkStateValidator,
    navigation: linkStateValidator
  })
});
