const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    displayName: String,
    familyName: String,
    givenName: String,
  },
  googleId: {
    type: String,
    required: true,
  },
  profileImgUrl: String,
  email: { type: String, require: true },
  emailVerified: Boolean,
  tokens: {
    access_token: String,
    refresh_token: String,
    scope: String,
    token_type: String,
    expiry_date: Number,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  invites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Invite' }],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
