'use strict'

const Schmervice = require('schmervice');
const { UniqueViolationError } = require('objection');
const current = require('../routes/users/current');

module.exports = class ArticleService extends Schmervice.Service {
  async findById(id, txn) {
    const { Article } = this.server.models();

    return await Article.query(txn).throwIfNotFound().findById(id);
  }

  async findBySlug(slug, txn) {
    const { Article } = this.server.models();

    return await Article.query(txn).throwIfNotFound().first().where({ slug });
  }
  
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

  async feed(currentUserId, { limit, offset }, txn) {
    const { Article } = this.server.models();

    const query = Article.query(txn)
      .joinRelation('author.followedBy')
      .where('auther:followedBy.id', currentUserId);

    const [articles, total] = await Promise.all([
      query.limit(limit).offset(offset).orderBy('createdAt', 'desc'),
      query.resultSize()
    ]);

    return { articles, total };
  }

  async create(currentUserId, { tagList, ...articleInfo }, txn) {
    const { Article, Tag } = this.server.models();

    if (tagList) {
      const ensureTag = async (name) => await this._ensureTag(name, txn);
      Promise.all(tagList.map(ensureTage));
    }

    const tags = tagList ? await Tag.query(txn).whereIn('name', tagList) : [];
    
    const { id } = await Article.query(txn).insertGraph({
      ...articleInfo,
      authorId: currentUserId,
      tags
    }, {
      relate: true
    });

    return id;
  }

  async _ensureTag(name, txn) {

    const { Tag } = this.server.models();

    try {
      await Tag.query(txn).insert({ name });
    }
    catch(err) {
      if (err instanceof UniqueViolationError) {
        return;
      }

      throw err;
    }
  }

  async update(currentUserId, id, articleInfo, txn) {
    const { Article } = this.server.models();
    
    const properArticleInfo = Object.keys(articleInfo).length !== 0;
    if (properArticleInfo) {
      await Article.query(txn).throwIfNotFound()
        .where({ id, authorId: currentUserId })
        .patch(articleInfo);
    }

    return id;
  }

  async delete(currentUserId, id, txn) {
    const { Article } = this.server.models();

    await Article.query(txn).throwIfNotFound().delete().where({
      id,
      authorId: currentUserId
    });
  }

  async favorite(currentUserId, id, txn) {
    const { Article } = this.server.models();

    const article = Article.fromJson({ id }, { skipValidation: true });

    try {
      await article.$relatedQuery('favoritedBy', txn).relate(currentUserId);
    }
    catch(err) {

      if (err instanceof UniqueViolationError) {
        return;
      }

      throw err;
    }
  }

  async unfavorite(currentUserId, id, txn) {
    const { Article } = this.server.models();

    const article = Article.fromJson({ id }, { skipValidation: true });

    await article.$relatedQuery('favoritedBy', txn).unrelate().where({ id: currentUserId });
  }
};