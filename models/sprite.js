var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var SpriteSchema = new mongoose.Schema({
  sprite_id: { type: String, default: shortid.generate, index: true },
  owner: String,
  create_at: { type: Date, default: Date.now },

  name: String,
  image: mongoose.Schema.Types.Mixed,
  json: mongoose.Schema.Types.Mixed
})


SpriteSchema.plugin(select, '-_id -__v')



module.exports = mongoose.model('Sprite', SpriteSchema)
