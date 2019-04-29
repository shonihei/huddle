const { google } = require('googleapis');

const makeNewOauth2Client = () => new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL,
);

module.exports = {
  makeNewOauth2Client,
};
