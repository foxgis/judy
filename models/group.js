var mongoose = require('mongoose')
var shortid = require('shortid')


var GroupSchema = new mongoose.Schema({
  group_id: { type: String, default: shortid.generate, index: true },
  name: String,
  users: [String],
  admin: String
}, { timestamps: true })


module.exports = mongoose.model('Group', GroupSchema)
