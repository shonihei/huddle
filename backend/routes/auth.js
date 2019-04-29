const fs = require('fs');
const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const { makeNewOauth2Client } = require('../oauth2-client');
const User = require('../models/user');
const { checkIfAuthenticated } = require('../middlewares/auth-middleware');

const scopes = [
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar',
];

const RSA_PRIVATE_KEY = fs.readFileSync('keys/jwtRS256.key');
const EXPIRES_IN = 3 * (24 * 60 * 60); // 3 days

/**
 * OAuth2 Workflow:
 * 1. Client requests for auth url
 * 2. User opens link, authorizes the app
 * 3. Google acknowledges the user's request
 * 4. Google sends callback to redirect_uri with code param set to an
 *    authorization code
 * 5. App server sends a request to google with the given authorization code
 * 6. Google receives the request with an authorization code
 * 7. Google responds with
 */

/**
 * Generates an Authentication Url to start the OAuth2 Workflow
 * The generated url will be in the form of:
 * https://accounts.google.com/o/oauth2/vs/auth?access_type=offline&
 *   scope=<scope>&response_type=code&client_id=<client_id>&
 *   redirect_uri=<redirect_uri>
 */
router.get('/', (_, res) => {
  const oauth2Client = makeNewOauth2Client();

  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  res.json({ url: authorizeUrl });
});

/**
 * Takes an authorization code supplied by the user and exchages it for
 * access code and refresh code
 */
router.post('/', async (req, res) => {
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
});

router.get('/status', checkIfAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).exec();
    if (!user) {
      res.status(400).json({
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
});

module.exports = router;
