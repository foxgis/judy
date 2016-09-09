var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


//该模块定义了一个schema，对应Mongodb数据库中的files集合，并导出模型，使其执行数据库CURD操作
var FileSchema = new mongoose.Schema({
  file_id: { type: String, default: shortid.generate, index: true },
  owner: String,
  scope: { type: String, default: 'private' },
  is_deleted: { type: Boolean, default: false },

  name: String,
  year: String,
  location: String,
  tags: [String],
  description: String,
  scale: Number,
  dimensions: [Number],

  filename: String,
  filesize: Number
}, { timestamps: true })


FileSchema.plugin(select, '-_id -__v')


FileSchema.index({ name: 'text', year: 'text', location: 'text', tags: 'text' })
FileSchema.index({ createdAt: -1 })
FileSchema.index({ updatedAt: -1 })


module.exports = mongoose.model('File', FileSchema)
