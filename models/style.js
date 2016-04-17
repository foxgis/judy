var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var StyleSchema = new mongoose.Schema({
  style_id: { type: String, default: shortid.generate(), index: true },
  owner: String,
  create_at: { type: Date, default: Date.now },
  modify_at: { type: Date, default: Date.now },
  draft: { type: Boolean, default: true },

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
  layers: [{
    id: String,
    type: String,
    metadata: mongoose.Schema.Types.Mixed,
    ref: String,
    source: String,
    'source-layer': String,
    minzoom: Number,
    maxzoom: Number,
    interactive: { type: Boolean, default: false },
    filter: [String],
    layout: mongoose.Schema.Types.Mixed,
    paint: mongoose.Schema.Types.Mixed
  }]
})


StyleSchema.plugin(select, '-_id -__v')



module.exports = mongoose.model('Style', StyleSchema)
