var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var StyleSchema = new mongoose.Schema({
  style_id: { type: String, default: shortid.generate, index: true },
  owner: String,
  scopes: { type: [String], default: ['private'] },
  draft: { type: Boolean, default: true },
  tags: [String],
  is_deleted: { type: Boolean, default: false },

  version: { type: Number, default: 8 },
  name: String,
  metadata: mongoose.Schema.Types.Mixed,
  center: [Number],
  zoom: Number,
  bearing: { type: Number, default: 0 },
  pitch: { type: Number, default: 0 },
  sources: mongoose.Schema.Types.Mixed,
  sprite: String,
  glyphs: String,
  transition: {
    duration: Number,
    delay: Number
  },
  layers: [mongoose.Schema.Types.Mixed]
}, { timestamps: true })


StyleSchema.plugin(select, '-_id -__v')


module.exports = mongoose.model('Style', StyleSchema)
