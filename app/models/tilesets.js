var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bodyParser = require('body-parser')

var TileSchema = new Schema({
  name: String,
  map_id: String,
  type: String,
  size: String,
  zoom_extent: [Number],
  format: String,
  bounds: [Number],
  subsets: [
    {
      name: String,
      type: String,
      zoom_extent: [Number],
      fields: [{
        name: String,
        type: String,
        description: String,
        values: Schema.Types.Mixed
      }]
    }
  ]
})

module.exports = mongoose.model('Tilesets',TileSchema)
