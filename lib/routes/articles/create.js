'use strict';

const Joi = require('@hapi/joi');
const Helpers = require('./helpers');
const Tag = require('../models/tag');
const Article = require('../models/article');

module.exports = Helpers.withDefaults({
  method: 'post',
  path: '/articles',
  options: {
    validate: {
      payload: {
        article: {
          title: Article.field('title').required(),
          description: Article.field('description').required(),
          body: Article.field('body').required(),
          tagList: Joi.array().items(Tag.field('name')),
        },
      },
    },
    auth: 'jwt',
    handler: async (request, h) => {
      const {
        credentials: { id: currentUserId },
      } = request.auth;
      const { article: articleInfo } = request.payload;
      const { articleService, displayService } = request.services();

      const createAndFetchArticle = async (txn) => {
        const id = await articleService.create(currentUserId, articleInfo, txn);

        return await articleService.findById(id, txn);
      };

      const article = await h.context.transaction(createAndFetchArticle);

      return {
        article: await displayService.articles(currentUserId, article),
      };
    },
  },
});