'use strict'

const Joi = require('@hapi/joi');
const Slugify = require('slugify');
const { Model } = require('./helpers');

module.exports = class Article extends Model {
  static get tableName() {
    return 'Articles';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      createdAt: Joi.date(),
      updatedAt: Joi.date(),
      autherId: Joi.number().integer().greater(0).require(),
      slug: Joi.string(),
      title: Joi.string().required(),
      body: Joi.string().required()
    });
  }

  static get relationMapping() {
    const Tag = require('./Tag');
    const User = require('./User');

    return {
      author: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'Articles.autherId',
          to: 'Users.id'
        }
      },
      tags: {
        relation: Model.ManyToManyRelation,
        modelClass: Tag,
        join: {
          from: 'ArticleTags.articleId',
          to: 'ArticleTags.tagId'
        }
      },
      favoritedBy: {
        relation: Model.ManyToManyRelation,
        modelClass: User,
        join: {
          from: 'ArticleFavorites.articleId',
          from: 'ArticleFavorites.userId'
        }
      },
    };
  }

  $beforeInsert() {
    const now = new Date();

    this.createdAt = now;
    this.updatedAt = now;
    this._setSlug();
  }

  $beforeUpdate() {
    const now = new Date();

    this.updatedAt = now;
    this._setSlug();
  }

  $parseDatabaseJson(json) {
    json = super.$parseDatabaseJson(json);

    json.createdAt = json.createdAt && new Date(json.createdAt);
    json.updatedAt = json.updatedAt && new Date(json.updatedAt);
  }

  _setSlug() {
    if (typeof this.title !== 'undefined') {
      this.slug = Slugify(this.title, { lower: true });
    }

    return this;
  }
};