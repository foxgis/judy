var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var SpriteSchema = new mongoose.Schema({
  sprite_id: { type: String, default: shortid.generate, index: true },
  owner: String,
  is_deleted: { type: Boolean, default: false },
  scope: { type: String, default: 'private' },

  name: { type: String, default: 'Sprite'},
  image: Buffer,
  json: String,
  image2x: Buffer,
  json2x: String
}, { timestamps: true })


SpriteSchema.plugin(select, '-_id -__v -is_deleted')


module.exports = mongoose.model('Sprite', SpriteSchema)
