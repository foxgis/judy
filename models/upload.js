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
  year: Number,
  location: String,
  description: String,
  tags: [String],
  size: Number,
  format: String,
  thumbnail: Buffer,
  mini_thumbnail: Buffer
}, { timestamps: true })


UploadSchema.plugin(select, '-_id -__v -file_id -is_deleted')


module.exports = mongoose.model('Upload', UploadSchema)
