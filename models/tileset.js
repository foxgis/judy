var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var TilesetSchema = new mongoose.Schema({
  tileset_id: { type: String, default: shortid.generate, index: true },
  owner: String,
  scope: { type: String, default: 'private' },
  is_deleted: { type: Boolean, default: false },

  name: String,
  tags: [String],
  description: String,
  tilejson: String,

  filename: String,
  filesize: Number
}, { timestamps: true })


TilesetSchema.plugin(select, '-_id -__v -is_deleted -tilejson')


TilesetSchema.index({ createdAt: -1 })
TilesetSchema.index({ updatedAt: -1 })


module.exports = mongoose.model('Tileset', TilesetSchema)
