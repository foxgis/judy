var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var UploadSchema = new mongoose.Schema({
  upload_id: { type: String, default: shortid.generate, index: true },
  file_id: mongoose.Schema.Types.ObjectId,
  owner: String,
  tags: [String],
  is_deleted: { type: String, default: false },

  name: String,
  description: String
}, { timestamps: true })


UploadSchema.plugin(select, '-_id -__v -file_id -is_deleted')


module.exports = mongoose.model('Upload', UploadSchema)
