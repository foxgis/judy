var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var TilesetSchema = new mongoose.Schema({
  tileset_id: { type: String, default: shortid.generate, index: true },
  owner: String,
  scopes: [String],
  filesize: Number,
  format: String,
  create_at: { type: Date, default: Date.now },
  is_deleted: { type: Boolean, default: false },

  tilejson: String,
  name: String,
  description: String,
  version: { type: String, default: '1.0.0' },
  attribution: String,
  template: String,
  legend: String,
  scheme: { type: String, default: 'xyz' },
  tiles: [String],
  minzoom: { type: Number, default: 0 },
  maxzoom: { type: Number, default: 22 },
  bounds: { type: [Number], default: [-180, -90, 180, 90] },
  center: [Number],

  vector_layers: [{
    id: String,
    description: String,
    minzoom: Number,
    maxzoom: Number,
    fields: [{
      name: String,
      type: String,
      description: String,
      values: [mongoose.Schema.Types.Mixed]
    }]
  }]
})


TilesetSchema.plugin(select, '-_id -__v')


module.exports = mongoose.model('Tileset', TilesetSchema)
