const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: {
    displayName: String,
    familyName: String,
    givenName: String,
  },
  googleId: {
    type: String,
    required: true
  },
  profileImage: {
    url: String,
    default: Boolean
  },
  email: { type: String, require: true },
  tokens: {
    access_token: String,
    refresh_token: String,
  }
})

module.exports = mongoose.model('User', userSchema)