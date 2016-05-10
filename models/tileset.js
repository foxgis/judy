var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var TilesetSchema = new mongoose.Schema({
  tileset_id: { type: String, default: shortid.generate, index: true },
  owner: String,
  scopes: { type: [String], default: ['private'] },
  is_deleted: { type: Boolean, default: false },
  uri: String,
  tags: [String],

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
  minzoom: { type: Number, default: 0 },
  maxzoom: { type: Number, default: 22 },
  bounds: { type: [Number], default: [-180, -90, 180, 90] },
  center: [Number],

  filesize: Number,
  format: String,
  vector_layers: [mongoose.Schema.Types.Mixed]
  // vector_layers: [{
  //   id: String,
  //   description: String,
  //   minzoom: Number,
  //   maxzoom: Number,
  //   fields: [{
  //     name: String,
  //     type: String,
  //     description: String,
  //     values: [mongoose.Schema.Types.Mixed]
  //   }]
  // }]
}, { timestamps: true })


TilesetSchema.plugin(select, '-_id -is_deleted -__v')


module.exports = mongoose.model('Tileset', TilesetSchema)
