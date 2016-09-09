var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


//该模块定义了一个schema，对应Mongodb数据库中的sprites集合，并导出模型，使其执行数据库CURD操作
var SpriteSchema = new mongoose.Schema({
  sprite_id: { type: String, default: shortid.generate, index: true },
  owner: String,
  scope: { type: String, default: 'public' },
  is_deleted: { type: Boolean, default: false },

  name: { type: String, default: 'sprite'},
  description: { type: String, default: ''},

  filename: String,
  filesize: Number
}, { timestamps: true })


SpriteSchema.plugin(select, '-_id -__v -is_deleted')


module.exports = mongoose.model('Sprite', SpriteSchema)
