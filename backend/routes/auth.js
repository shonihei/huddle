const express = require('express')
const { google } = require('googleapis')
const router = express.Router()
const oauth2Client = require('../oauth2-client')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const fs = require('fs')

const scopes = [
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar'
]

const RSA_PRIVATE_KEY = fs.readFileSync('keys/jwtRS256.key')

/**
 * OAuth2 Workflow:
 * 1. Client requests for auth url
 * 2. User opens link, authorizes the app
 * 3. Google acknowledges the user's request
 * 4. Google sends callback to redirect_uri with code param set to an authorization code
 * 5. App server sends a request to google with the given authorization code
 * 6. Google receives the request with an authorization code
 * 7. Google responds with 
 */

/**
 * Generates an Authentication Url to start the OAuth2 Workflow
 * The generated url will be in the form of:
 * https://accounts.google.com/o/oauth2/vs/auth?access_type=offline&
 *   scope=<scope>&response_type=code&client_id=<client_id>&redirect_uri=<redirect_uri>
 */
router.get('/', (_, res) => {
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  })
  res.json({ url: authorizeUrl})
})

router.post('/', async (req, res) => {
  const code = req.body.authorization_code;
  const { tokens } = await oauth2Client.getToken(code)
  const { payload } = await oauth2Client.verifyIdToken({ idToken: tokens.id_token })
  const { name, family_name, given_name, sub, picture, email, email_verified } = payload;
  const { access_token, refresh_token, scope, token_type, expiry_date } = tokens;
  const update = {
    name: {
      displayName: name,
      familyName: family_name,
      givenName: given_name
    },
    googleId: sub,
    profileImgUrl: picture,
    email: email,
    emailVerified: email_verified,
    tokens: {
      accessToken: access_token,
      refreshToken: refresh_token,
      scope: scope,
      tokenType: token_type,
      expiryDate: expiry_date
    }
  };

  const queryOptions = {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  }
  const user = await User.findOneAndUpdate({ googleId: sub }, update, queryOptions).exec()

  const expiresIn = 3 * (24 * 60 * 60) // 3 days
  res.json({
    expiresIn,
    user: {
      email,
      name: user.name,
      profileImgUrl: picture,
      token: jwt.sign({}, RSA_PRIVATE_KEY, {
        algorithm: 'RS256',
        expiresIn,
        subject: user.id
      })
    }
  });
})

/* 
this route is no longer needed because the frontend acts as a callback 
leaving it here just for the sake of documentation
*/
router.get('/callback', async (req, res) => {
  const code = req.query.code
  const { tokens } = await oauth2Client.getToken(code)
  console.log(tokens)
  const verify = await oauth2Client.verifyIdToken({ idToken: tokens.id_token })
  console.log(verify)
  oauth2Client.setCredentials(tokens)
  const profile = google.people({ version: 'v1', auth: oauth2Client })
  res.send(await profile.people.get({ personFields: 'emailAddresses,names,photos,metadata', resourceName: 'people/me'}))
  // res.send(`access token: ${tokens.access_token}`)
})

module.exports = router