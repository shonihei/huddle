const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema({
  name: String,
  slug: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dateCreated: Date,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
})

module.exports = mongoose.model('Room', roomSchema)