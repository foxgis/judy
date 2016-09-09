var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


//该模块定义了一个schema，对应Mongodb数据库中的templates集合，并导出模型，使其执行数据库CURD操作
var TemplateSchema = new mongoose.Schema({
  template_id: { type: String, default: shortid.generate, index: true },
  owner: String,
  scope: { type: String, default: 'public' },
  is_deleted: { type: Boolean, default: false },

  name: String,
  style: String,
  replace: String,
  styleJSON: Buffer,
  imageName: String,

  thumb: mongoose.Schema.Types.Mixed
}, { timestamps: true })


TemplateSchema.plugin(select, '-_id -__v -is_deleted -styleJSON -imageName')


TemplateSchema.index({ createdAt: -1 })
TemplateSchema.index({ updatedAt: -1 })


module.exports = mongoose.model('Template', TemplateSchema)
