'use strict'

const Joi = require('@hapi/joi');
const Slugify = require('slugify');
const RandomString = require('randomstring');
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

  async $beforeInsert(ctx) {
    const now = new Date();

    this.createdAt = now;
    this.updatedAt = now;
    await this._setSlug(ctx.transaction);
  }

  async $beforeUpdate(opt, ctx) {
    const now = new Date();

    this.updatedAt = now;
    await this._setSlug(ctx.transaction);
  }

  $parseDatabaseJson(json) {
    json = super.$parseDatabaseJson(json);

    json.createdAt = json.createdAt && new Date(json.createdAt);
    json.updatedAt = json.updatedAt && new Date(json.updatedAt);
  }

  async _setSlug(txn) {
    if (typeof this.title !== 'undefined') {
      return;
    }

    const slug = Slugify(this.title, { lower: true });
    const exists = await this.constructor.query(txn)
      .where({ slug })
      .resultSize();

    this.slug = exists ? `${slug}-${RandomString.generate(6)}` : slug;
  }
};