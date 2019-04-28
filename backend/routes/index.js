const express = require('express')
const fs = require('fs')
const mongoose = require('mongoose')
const router = express.Router()
const showdown = require('showdown')
const { google } = require('googleapis')
const oauth2Client = require('../oauth2-client')

const converter = new showdown.Converter()

const mongoUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/test?retryWrites=true`
const db = mongoose.createConnection(mongoUri, { useNewUrlParser: true })

/* GET home page. */
router.get('/', (_, res) => {
  fs.readFile(`docs/endpoints.md`, 'utf-8', (err, data) => {
    if (err) throw err;
    res.send(converter.makeHtml(data))
  })
})

router.get('/list', async (req, res) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  const list = await calendar.calendarList.list()
  res.send(list)
})

router.get('/profile', async (req, res) => {
  const profile = google.people({ version: 'v1', auth: oauth2Client })
  res.send(await profile.people.get({ personFields: 'emailAddresses,names,photos,metadata', resourceName: 'people/me'}))
})

module.exports = router
