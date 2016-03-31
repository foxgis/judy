var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bodyParser = require('body-parser')

var TileSetSchema = new Schema({
  name: String,
  map_id: String,
  type: String,  /* vector or raster */
  filesize: String,
  maxzoom: Number,
  minzoom: Number,
  format: String,  /* file format, eg: png,pbf */
  created: Date,
  bounds: [Number],  /* Southwest to Northeast */
  center: [Number],
  private: Boolean,
  scheme: String,   /* "xyz" */
  tiles: [String],  /* tile host */
  vector_layers: [
    {
      name: String,
      id: String,
      description: String,
      fields: [{
        name: String,
        type: String,
        description: String,
        values: [Schema.Types.Mixed]
      }]
    }
  ]
})



module.exports = mongoose.model('Tileset',TileSetSchema)
