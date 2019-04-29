const expressJwt = require('express-jwt');
const fs = require('fs');

const { makeNewOauth2Client } = require('../oauth2-client');
const User = require('../models/user');

// Open public key for decoding and store in memory
const RSA_PUBLIC_KEY = fs.readFileSync('keys/jwtRS256.key.pub');

const checkIfAuthenticated = expressJwt({
  secret: RSA_PUBLIC_KEY,
});

/**
 * Creates an OAuth2Client and attaches it to the request object
 */
const createOauth2Client = async (req, res, next) => {
  // if `user` property is not set, move to next middleware
  if (!req.user) next();

  try {
    const user = await User.findById(req.user.sub);
    const oauth2Client = makeNewOauth2Client();
    oauth2Client.setCredentials({
      access_token: user.tokens.access_token,
      refresh_token: user.tokens.refresh_token,
      scope: user.tokens.scope,
      token_type: user.token_type,
      expiry_date: user.expiry_date,
    });
    oauth2Client.on('tokens', async (tokens) => {
      user.tokens.access_token = tokens.access_token;
      user.tokens.scope = tokens.scope;
      user.tokens.token_type = tokens.token_type;
      user.tokens.expiry_date = tokens.expiry_date;
      await user.save();
    });
    req.oauth2Client = oauth2Client;
    next();
  } catch (err) {
    next();
  }
};

const handleUnauthorizedError = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      message: 'invalid token',
    });
  } else {
    next();
  }
};

module.exports = {
  checkIfAuthenticated,
  createOauth2Client,
  handleUnauthorizedError,
};
