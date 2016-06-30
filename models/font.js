var mongoose = require('mongoose')
var select = require('mongoose-json-select')


var FontSchema = new mongoose.Schema({
  fontname: { type: String, index: true },
  owner: String,
  scope: { type: String, default: 'public' },
  is_deleted: { type: Boolean, default: false },

  family_name: String,
  style_name: String,
  coverages: [{
    name: String,
    id: String,
    count: Number,
    total: Number,
    _id: false
  }],

  filename: String,
  filesize: Number
}, { timestamps: true })


FontSchema.plugin(select, '-_id -__v -is_deleted')


module.exports = mongoose.model('Font', FontSchema)
