const express = require('express')
const { google } = require('googleapis')
const router = express.Router()
const oauth2Client = require('../oauth2-client')

const scopes = [
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar'
]

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
  res.json(tokens);
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