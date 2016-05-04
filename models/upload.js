var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var UploadSchema = new mongoose.Schema({
  upload_id: { type: String, default: shortid.generate, index: true },
  file_id: mongoose.Schema.Types.ObjectId,
  filename: String,
  filesize: Number,
  owner: String,
  is_deleted: { type: Boolean, default: false },

  tileset_id: String,
  font_id: String,
  sprite_id: String,

  complete: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
  error: String
}, { timestamps: true })


UploadSchema.plugin(select, '-_id -file_id -is_deleted -__v')


module.exports = mongoose.model('Upload', UploadSchema)
