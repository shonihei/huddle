const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: String,
  slug: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dateCreated: { type: Date, default: Date.now },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

module.exports = mongoose.model('Room', roomSchema);
