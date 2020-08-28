"use strict";

const Joi = require("@hapi/joi");
const Helpers = require("../helpers");
const User = require("../../models/user");

module.exports = Helpers.withDefaults({
  method: "get",
  path: "/profiles/{username}",
  options: {
    validate: {
      params: Joi.object({
        username: User.field("username"),
      }),
    },
    auth: { strategy: "jwt", mode: "optional" },
    handler: async (request) => {
      const { username } = request.params;
      const { credentials } = request.auth;
      const { userService, displayService } = request.services();

      const user = await userService.findByUsername(username);
      const currentUserId = credentials && credentials.id;

      return {
        profile: await displayService.profile(currentUserId, user),
      };
    },
  },
});
