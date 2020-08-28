'use strict'

module.exports = (server, options) => ({
  scheme: 'jwt',
  options: {
    key: options.jwtKey,
    cookieKey: false,
    verifyOptions: { algorithm: ['HS256'] },
    validate: async (decoded, request) => {
      const { userService } = request.services();
      const user = await userService.findById(decoded.id);

      return {
        isValid: !!user,
        credentials: user
      };
    }
  }
});