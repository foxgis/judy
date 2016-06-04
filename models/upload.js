var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var UploadSchema = new mongoose.Schema({
  upload_id: { type: String, default: shortid.generate, index: true },
  file_id: mongoose.Schema.Types.ObjectId,
  owner: String,
  scope: { type: String, default: 'private' },
  is_deleted: { type: String, default: false },

  name: String,
  location: String,
  year: String,
  tags: [String],
  description: String,
  size: Number,
  format: String,
  thumbnail: Buffer,
  mini_thumbnail: Buffer
}, { timestamps: true })


UploadSchema.plugin(select, '-_id -__v -file_id -is_deleted -thumbnail -mini_thumbnail')


UploadSchema.index({ name: 'text', year: 'text', location: 'text', tags: 'text' })


module.exports = mongoose.model('Upload', UploadSchema)
