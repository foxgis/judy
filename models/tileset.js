var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var TilesetSchema = new mongoose.Schema({
  tileset_id: { type: String, default: shortid.generate, index: true },
  owner: String,
  scope: { type: String, default: 'private' },
  is_deleted: { type: Boolean, default: false },

  tags: [String],
  filename: String,
  filesize: Number,

  // tilejson spec
  tilejson: { type: String, default: '2.1.0' },
  name: String,
  description: String,
  version: { type: String, default: '1.0.0' },
  attribution: String,
  template: String,
  legend: String,
  scheme: { type: String, default: 'xyz' },
  tiles: [String],
  grids: [String],
  data: [String],
  minzoom: { type: Number, default: 0 },
  maxzoom: { type: Number, default: 22 },
  bounds: { type: [Number], default: [-180, -90, 180, 90] },
  center: [Number],

  formatter: String,
  resolution: Number,
  format: String,
  vector_layers: [{
    _id: false,
    id: String,
    description: String,
    minzoom: Number,
    maxzoom: Number,
    source: String,
    source_name: String,
    fields: mongoose.Schema.Types.Mixed
  }]
}, { timestamps: true })


TilesetSchema.plugin(select, '-_id -__v -is_deleted')


TilesetSchema.index({ createdAt: -1 })
TilesetSchema.index({ updatedAt: -1 })


module.exports = mongoose.model('Tileset', TilesetSchema)
