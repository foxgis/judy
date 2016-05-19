var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var FontSchema = new mongoose.Schema({
  font_id: { type: String, default: shortid.generate, index: true },
  owner: String,
  scopes: { type: String, default: 'public' },

  name: { type: String, index: true }
}, { timestamps: true })


FontSchema.plugin(select, '-_id -__v')


module.exports = mongoose.model('Font', FontSchema)
