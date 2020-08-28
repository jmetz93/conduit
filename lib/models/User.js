'use strict';

const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class User extends Model {

  static get tableName() {

      return 'Users';
  }

  static get joiSchema() {

      return Joi.object({
          id: Joi.number().integer().greater(0),
          email: Joi.string().email().required(),
          password: Joi.binary()
      });
  }
};