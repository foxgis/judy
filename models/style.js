var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


//该模块定义了一个schema，对应Mongodb数据库中的styles集合，并导出模型，使其执行数据库CURD操作
var StyleSchema = new mongoose.Schema({
  style_id: { type: String, default: shortid.generate, index: true },
  owner: String,
  scope: { type: String, default: 'private' },
  is_deleted: { type: Boolean, default: false },

  tags: [String],
  description: String,

  version: { type: Number, default: 8 },
  name: String,
  metadata: mongoose.Schema.Types.Mixed,
  center: [Number],
  zoom: Number,
  bearing: { type: Number, default: 0 },
  pitch: { type: Number, default: 0 },
  sources: mongoose.Schema.Types.Mixed,
  sprite: String,
  glyphs: String,
  transition: {
    duration: Number,
    delay: Number
  },
  layers: [mongoose.Schema.Types.Mixed]
}, { timestamps: true, minimize: false })


StyleSchema.plugin(select, '-_id -__v -is_deleted')


StyleSchema.index({ createdAt: -1 })
StyleSchema.index({ updatedAt: -1 })


module.exports = mongoose.model('Style', StyleSchema)
