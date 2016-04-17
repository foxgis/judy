var mongoose = require('mongoose')


var GroupSchema = new mongoose.Schema({
  groupname: { type: String, index: { unique: true } },
  users: [String],
  admin: String,
  create_at: { type: Date, default: Date.now }
})


module.exports = mongoose.model('Group', GroupSchema)
