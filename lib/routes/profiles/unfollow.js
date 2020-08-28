"use strict";

const Joi = require("@hapi/joi");
const Helpers = require("../helpers");
const User = require("../../models/user");

module.exports = Helpers.withDefaults({
  method: "delete",
  path: "/profiles/{username}/follow",
  options: {
    validate: {
      params: Joi.object({
        username: User.field("username"),
      }),
    },
    auth: "jwt",
    handler: async (request, h) => {
      const { username } = request.params;
      const {
        credentials: { id: currentUserId },
      } = request.auth;
      const { userService, displayService } = request.services();

      const user = await userService.findByUsername(username);

      const unfollowUserAndFetchProfile = async (txn) => {
        await userService.unfollow(currentUserId, user.id, txn);

        return await displayService.profile(currentUserId, user, txn);
      };

      const profile = await h.context.transaction(unfollowUserAndFetchProfile);

      return { profile };
    },
  },
});
