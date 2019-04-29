const express = require('express');
const fs = require('fs');
const { google } = require('googleapis');

const router = express.Router();
const showdown = require('showdown');

const { checkIfAuthenticated, createOauth2Client } =
  require('../middlewares/auth-middleware');

const converter = new showdown.Converter();

/* GET home page. */
router.get('/', (_, res) => {
  fs.readFile('docs/endpoints.md', 'utf-8', (err, data) => {
    if (err) throw err;
    res.send(converter.makeHtml(data));
  });
});

router.get('/list', checkIfAuthenticated, createOauth2Client,
  async (req, res) => {
    const calendar = google.calendar({ version: 'v3', auth: req.oauth2Client });

    const list = await calendar.calendarList.list();
    res.json(list);
  });

module.exports = router;
