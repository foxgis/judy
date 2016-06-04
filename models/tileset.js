var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var TilesetSchema = new mongoose.Schema({
  tileset_id: { type: String, default: shortid.generate, index: true },
  owner: String,
  scope: { type: String, default: 'private' },
  is_deleted: { type: String, default: false },

  location: String,
  year: String,
  tags: [String],

  // tilejson spec
  tilejson: { type: String, default: '2.1.0' },
  name: String,
  description: String,
  version: { type: String, default: '1.0.0' },
  attribution: String,
  template: String,
  legend: String,
  formatter: String,
  scheme: { type: String, default: 'xyz' },
  tiles: [String],
  grids: [String],
  data: [String],
  minzoom: { type: Number, default: 0 },
  maxzoom: { type: Number, default: 22 },
  resolution: Number,
  bounds: { type: [Number], default: [-180, -90, 180, 90] },
  center: [Number],

  filesize: Number,
  format: String,
  vector_layers: [{
    _id: false,
    id: String,
    description: String,
    minzoom: Number,
    maxzoom: Number,
    fields: [mongoose.Schema.Types.Mixed]
  }],

  complete: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
  error: String
}, { timestamps: true })


TilesetSchema.plugin(select, '-_id -__v -is_deleted')


TilesetSchema.index({ name: 'text', year: 'text', location: 'text', tags: 'text' })
TilesetSchema.index({ createdAt: -1 })
TilesetSchema.index({ updatedAt: -1 })


module.exports = mongoose.model('Tileset', TilesetSchema)
