var mongoose = require('mongoose')
var select = require('mongoose-json-select')
var shortid = require('shortid')


var FontSchema = new mongoose.Schema({
  font_id: { type: String, default: shortid.generate, index: true },
  owner: String,
<<<<<<< HEAD
  is_deleted: { type: Boolean, default: false},
  scope: { type: String, default: 'private' },
=======
  scopes: { type: String, default: 'public' },
>>>>>>> ce84b4767bf7fadba831c20396637e9aad2f750b

  name: { type: String, index: true }
}, { timestamps: true })


FontSchema.plugin(select, '-_id -__v')


module.exports = mongoose.model('Font', FontSchema)
