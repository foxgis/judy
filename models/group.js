var mongoose = require('mongoose')
var shortid = require('shortid')
var select = require('mongoose-json-select')


var GroupSchema = new mongoose.Schema({
  group_id: { type: String, default: shortid.generate, index: true },
  name: String,
  members: [String],
  admin: String
}, { timestamps: true })

GroupSchema.plugin(select,'-_id -__v')


module.exports = mongoose.model('Group', GroupSchema)
