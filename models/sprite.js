var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var SpriteSchema = new mongoose.Schema({
  sprite_id: { type: String, default: shortid.generate, index: true },
  owner: String,
  scope: { type: String, default: 'public' },
  is_deleted: { type: Boolean, default: false },

  name: { type: String, default: 'sprite'}
}, { timestamps: true })


SpriteSchema.plugin(select, '-_id -__v -is_deleted')


module.exports = mongoose.model('Sprite', SpriteSchema)
