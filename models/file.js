var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var FileSchema = new mongoose.Schema({
  file_id: { type: String, default: shortid.generate, index: true },
  fs_id: mongoose.Schema.Types.ObjectId,
  owner: String,
  tags: [String],

  name: String,
  description: String
}, { timestamps: true })


FileSchema.plugin(select, '-_id -__v -fs_id')


module.exports = mongoose.model('File', FileSchema)
