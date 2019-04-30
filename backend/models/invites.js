const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
});

const Invite = mongoose.model('Invite', inviteSchema);

module.exports = Invite;
