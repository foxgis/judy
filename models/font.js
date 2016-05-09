var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var FontSchema = new mongoose.Schema({
  font_id: { type: String, default: shortid.generate, index: true },
  owner: String,
  is_deleted: { type: Boolean, default: false},
  scopes: { type: [String], default: ['private'] },

  name: String,
  glyph: Buffer
}, { timestamps: true })


FontSchema.plugin(select, '-_id -__v')


module.exports = mongoose.model('Font', FontSchema)
