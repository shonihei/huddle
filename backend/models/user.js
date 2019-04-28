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
  profileImgUrl: String,
  email: { type: String, require: true },
  emailVerified: Boolean,
  tokens: {
    accessToken: String,
    refreshToken: String,
    scope: String,
    tokenType: String,
    expiryDate: Number
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  }
})

const User = mongoose.model('User', userSchema)

module.exports = User