var mongoose = require('mongoose')


var UploadSchema = new mongoose.Schema({
  upload_id: String,
  file_id: mongoose.Schema.Types.ObjectId,
  filename: String,
  format: String,
  filesize: Number,
  owner: String,
  upload_at: { type: Date, default: Date.now }
})


module.exports = mongoose.model('Upload', UploadSchema)
