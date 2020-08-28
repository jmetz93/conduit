'use strict'

const Schmervice = require('schmervice');

module.exports = class ArticleService extends Schmervice.Service {
  async find({ tag, author, favorited, limit, offset}, txn) {
    const { Article } = this.server.models();

    const query = Article.query(txn);

    if (tag) {
      query.innerJoinRelation('tags').where('tags.name', tag);
    }

    if (author) {
      query.innerJoinRelation('author').where('auther.username', author);
    }

    if (favorited) {
      query.innerJoinRelation('favoritedBy').where('favoritedBy.username', favorited);
    }

    const [articles, total] = await Promise.all([
      query.limit(limit).offset(offset).orderedBy('createdAt', 'desc'),
      query.resultSize()
    ]);

    return { articles, total };
  }
};