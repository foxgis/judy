var mongoose = require('mongoose')


var NgccSchema = new mongoose.Schema({
  field_name: String,
  field_data: mongoose.Schema.Types.Mixed,
  description: String,
  type: String
}, { timestamps: true })


NgccSchema.index({ field_name: 1 })
NgccSchema.index({ description: '' })
NgccSchema.index({ type: '' })


module.exports = NgccSchema
