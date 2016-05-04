var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var SpriteSchema = new mongoose.Schema({
  sprite_id: { type: String, default: shortid.generate, index: true },
  owner: String,
  is_deleted: { type: Boolean, default: false},

  name: String,
  image: Buffer,
  json: mongoose.Schema.Types.Mixed
}, { timestamps: true })


SpriteSchema.plugin(select, '-_id -__v')


module.exports = mongoose.model('Sprite', SpriteSchema)
