var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


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
