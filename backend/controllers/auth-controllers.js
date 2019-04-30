const fs = require('fs');
const jwt = require('jsonwebtoken');

const { makeNewOauth2Client } = require('../oauth2-client');
const User = require('../models/users');

const SCOPES = [
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar',
];
const EXPIRES_IN = 3 * (24 * 60 * 60); // 3 days
const RSA_PRIVATE_KEY = fs.readFileSync('keys/jwtRS256.key');

/**
 * Generates an Authentication Url to start the OAuth2 Workflow
 */
const generateAuthUrl = (_, res) => {
  const oauth2Client = makeNewOauth2Client();

  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  res.json({ url: authorizeUrl });
};

/**
 * Takes an authorization code supplied by the user and exchages it for
 * access code and refresh code
 */
const exchangeAuthorization = async (req, res) => {
  const oauth2Client = makeNewOauth2Client();

  const code = req.body.authorization_code;
  if (!code) {
    res.status(400).json({
      message: 'missing authorization code',
    });
  } else {
    const { tokens } = await oauth2Client.getToken(code);
    const { payload } = await oauth2Client.verifyIdToken(
      { idToken: tokens.id_token },
    );
    const {
      name, family_name, given_name, sub, picture, email, email_verified,
    } = payload;
    const update = {
      name: {
        displayName: name,
        familyName: family_name,
        givenName: given_name,
      },
      googleId: sub,
      profileImgUrl: picture,
      email,
      emailVerified: email_verified,
      tokens,
    };

    const queryOptions = {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    };
    const user = await User
      .findOneAndUpdate({ googleId: sub }, update, queryOptions).exec();

    res.status(200).json({
      expiresIn: EXPIRES_IN,
      user: {
        email,
        name: user.name,
        profileImgUrl: picture,
        token: jwt.sign({}, RSA_PRIVATE_KEY, {
          algorithm: 'RS256',
          expiresIn: EXPIRES_IN,
          subject: user.id,
        }),
      },
    });
  }
};

/**
 * Look up user using the id stored in the jwt
 */
const getAuthStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).exec();
    if (!user) {
      res.status(404).json({
        message: 'user does not exist',
      });
    } else {
      res.status(200).json({
        expiresIn: EXPIRES_IN,
        user: {
          email: user.email,
          name: user.name,
          profileImgUrl: user.profileImgUrl,
          token: jwt.sign({}, RSA_PRIVATE_KEY, {
            algorithm: 'RS256',
            expiresIn: EXPIRES_IN,
            subject: user.id,
          }),
        },
      });
    }
  } catch (err) {
    res.status(500).json({
      message: 'something went wrong on the server',
    });
  }
};

module.exports = {
  generateAuthUrl,
  exchangeAuthorization,
  getAuthStatus,
};
