var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


//该模块定义了一个schema，对应Mongodb数据库中的tilesets集合，并导出模型，使其执行数据库CURD操作
var IndexSchema = new mongoose.Schema({
  tileset_id: { type: String, default: shortid.generate, index: true },
  owner: String,
  is_deleted: { type: Boolean, default: false },
  layers: mongoose.Schema.Types.Mixed
}, { timestamps: true })


IndexSchema.plugin(select, '-_id -__v -is_deleted')


IndexSchema.index({ createdAt: -1 })
IndexSchema.index({ updatedAt: -1 })


module.exports = IndexSchema
