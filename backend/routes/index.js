const express = require('express')
const fs = require('fs')
const router = express.Router()
const showdown = require('showdown')
const { google } = require('googleapis')
const oauth2Client = require('../oauth2-client')
const expressJwt = require('express-jwt')
const User = require('../models/user')

const RSA_PUBLIC_KEY = fs.readFileSync('keys/jwtRS256.key.pub')

const converter = new showdown.Converter()
const checkIfAuthenticated = expressJwt({
  secret: RSA_PUBLIC_KEY,
})

/* GET home page. */
router.get('/', (_, res) => {
  fs.readFile(`docs/endpoints.md`, 'utf-8', (err, data) => {
    if (err) throw err;
    res.send(converter.makeHtml(data))
  })
})

router.get('/list', checkIfAuthenticated, async (req, res) => {
  console.log(req.user)
  const user = await User.findById(req.user.sub)
  oauth2Client.setCredentials({
    access_token: user.tokens.accessToken,
    refresh_token: user.tokens.refresh_token,
    scope: user.tokens.scope,
    token_type: user.token_type,
    expiry_date: user.expiry_date,
  })
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  const list = await calendar.calendarList.list()
  res.json(list)
})

module.exports = router
