var mongoose = require('mongoose')
var shortid = require('shortid')
var select = require('mongoose-json-select')


var GroupSchema = new mongoose.Schema({
  group_id: { type: String, default: shortid.generate, index: true },
  name: { type: String, index: { unique: true } },
  members: [String],
  applicants: [String],
  admin: String,

  is_verified: { type: Boolean, default: false }
}, { timestamps: true })

GroupSchema.plugin(select,'-_id -__v')


module.exports = mongoose.model('Group', GroupSchema)
