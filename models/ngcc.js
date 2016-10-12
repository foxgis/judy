var mongoose = require('mongoose')


var NgccSchema = new mongoose.Schema({
  field_name: String,
  field_data: mongoose.Schema.Types.Mixed
}, { timestamps: true })


NgccSchema.index({ field_name: 1 })


module.exports = NgccSchema
