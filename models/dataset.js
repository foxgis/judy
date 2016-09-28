var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


//该模块定义了一个schema，对应Mongodb数据库中的datasets集合，并导出模型，使其执行数据库CURD操作
var DatasetSchema = new mongoose.Schema({
  dataset_id: { type: String, default: shortid.generate, index: true },
  owner: String,
  scope: { type: String, default: 'public' },
  is_deleted: { type: Boolean, default: false },

  filename: String,
  filesize: Number,
  bounds: { type: [Number], default: [-180, -90, 180, 90] },
  center: [Number],
  format: String,
}, { timestamps: true })


DatasetSchema.plugin(select, '-_id -__v -is_deleted')


DatasetSchema.index({ createdAt: -1 })
DatasetSchema.index({ updatedAt: -1 })


module.exports = mongoose.model('Dataset', DatasetSchema)
