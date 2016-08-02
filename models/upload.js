var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var UploadSchema = new mongoose.Schema({
  upload_id: { type: String, default: shortid.generate, index: true },
  file_id: mongoose.Schema.Types.ObjectId,
  owner: String,
  scope: { type: String, default: 'private' },
  is_deleted: { type: Boolean, default: false },
  downloadNum: { type: Number, default: 0 },

  name: String,
  location: String,
  scale: Number,
  dimensions: [Number],
  year: String,
  tags: [String],
  description: String,
  size: Number,
  format: String,
  thumbnail: Buffer,
  mini_thumbnail: Buffer
}, { timestamps: true })


UploadSchema.plugin(select, '-_id -__v -file_id -thumbnail -mini_thumbnail')


UploadSchema.index({ name: 'text', year: 'text', location: 'text', tags: 'text' })
UploadSchema.index({ createdAt: -1 })
UploadSchema.index({ updatedAt: -1 })


module.exports = mongoose.model('Upload', UploadSchema)
