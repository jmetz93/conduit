'use strict';

const Schmervice = require('schmervice');

const internals = {};

module.exports = class DisplayService extends Schmervice.Service {
  user({ password, ...user }, token) {
    return { ...user, token };
  }

  async profile(currentUserId, user, txn) {
    const { User } = this.server.models();
    const { toProfile } = internals;

    const result = await User.loadRelated(
      user,
      `[
      followedBy(currentUser) as following
    ]`,
      {
        currentUser: (builder) => builder.where('Users.id', currentUserId),
      },
      txn
    );

    // const toProfile = ({ password, followedBy, ...user }) => ({
    //   ...user,
    //   following: followedBy.length > 0,
    // });

    return toProfile(result);
  }

  async articles(currentUserId, articles, txn) {
    const { Article } = this.server.models();
    const { toArticle } = internals;

    const results = await Article.loadRelated(
      articels,
      `[
      tags,
      favoritedBy(currentUser) as favorited,
      favoritedBy(count) as favoritesCount,
      auther.[
        followedBy(currentUser) as following
      ]
    ]`,
      {
        currentUser: (builder) => builder.where('Users.id', currentUserId),
        count: (builder) => builder.count('* as count').groupBy('articleId'),
      },
      txn
    );

    return Array.isArray(results) ? results.map(toArticle) : toArticle(results);
  }
};

internals.toProfile = ({ password, email, following, ...user }) => ({
  ...user,
  following: following.length > 0,
});

internals.toArticle = ({
  tags,
  favorited,
  favoritesCount,
  authorId,
  author,
  ...article
}) => ({
  ...article,
  tagList: tags.map((tag) => tag.name),
  favorited: favorited.length > 0,
  favoritesCount: favoritesCount[0] ? favoritesCount[0].count : 0,
  auther: internals.toProfile(author),
});
