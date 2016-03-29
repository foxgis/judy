var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bodyParser = require('body-parser')

var UploadSchema = new Schema({
  complete: Boolean,
  created: Date,
  id: String,
  modified: String,  /* most cases, it should be equal to created */
  name: String,  /* file name when you upload it*/
  owner: String,  /* default to the username if you haven't shared */
  tileset: String  /* some kind of map_id */
})

module.exports = mongoose.model('Upload',UploadSchema)

