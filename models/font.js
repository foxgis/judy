var mongoose = require('mongoose')
var select = require('mongoose-json-select')


var FontSchema = new mongoose.Schema({
  fontname: { type: String, index: { unique: true } },
  owner: String,
  scope: { type: String, default: 'public' },
  is_deleted: {type: Boolean, default: false}
}, { timestamps: true })


FontSchema.plugin(select, '-_id -__v is_deleted')


module.exports = mongoose.model('Font', FontSchema)
